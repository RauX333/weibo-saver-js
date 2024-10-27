import {
  getWeiboURLFromMailBody,
  weiboTextReg,
  filenameTitleFilter,
} from "./utils.js";
import { JSDOM } from "jsdom";
import got from "got";
import fs from "fs";
import path from "path";
import TurndownService from "turndown";
import mustache from "mustache";
import { v4 as uuidv4 } from 'uuid';

export async function fetchWeibo(mail) {
  // get weibourl from mailbody
  const weibourl = getWeiboURLFromMailBody(mail.mailBody);
  console.log("weibourl", weibourl);
  const response = await got.get(weibourl);
  const pageBody = new JSDOM(response.body, {
    runScripts: "dangerously",
    resources: "usable",
  });
  const allData = pageBody.window.$render_data;
  // console.log("!!!!!!!!!!!!!!!!alldata",allData);
  let weiboData = {};
  try {
    weiboData = parseWeiboData(allData);
  } catch (error) {
    weiboData = {
      originTextMD: mail.mailBody,
      originUser: "MailBody",
      outerTextMD: uuidv4() + error,
      outerUser: "Error",
      largeImgs: "",
      createdAt: new Date().toISOString().replace(/T/, " ").replace(/\..+/, ""),
      videoPageUrls: [],
    };
  }

  // console.log(weiboData);
  //get today's year, timezone is utc8, create folder named yyyy
  const todayYear = new Date().toISOString().substr(0, 4);
  let savedDataPathYear = path.join(process.cwd(), `saved_data/${todayYear}`);
  if (!fs.existsSync(savedDataPathYear)) {
    fs.mkdirSync(savedDataPathYear);
  }
  //get today's month, timezone is utc8, create folder named mm
  const todayMonth = new Date().toISOString().substr(5, 2);
  let savedDataPathMonth = path.join(savedDataPathYear, `${todayMonth}`);
  if (!fs.existsSync(savedDataPathMonth)) {
    fs.mkdirSync(savedDataPathMonth);
  }

  //get today's date in the format YYYY-MM-DD, timezone is utc8
  const today = new Date().toISOString().substr(0, 10);
  // see if folder exists at ./saved_data
  const savedDataPath = path.join(savedDataPathMonth, `${today}`);
  const imagePath = path.join(savedDataPath, "images");
  if (!fs.existsSync(savedDataPath)) {
    fs.mkdirSync(savedDataPath);
  }
  if (!fs.existsSync(imagePath)) {
    fs.mkdirSync(imagePath);
  }

  // generate md file title
  let title = weiboData.outerTextMD;
  if (weiboData.outerTextMD.length > 40) {
    title = weiboData.outerTextMD.substring(0, 40);
  }
  title = weiboData.outerUser + "-" + title;
  title = filenameTitleFilter(title);
  const mdFileName = `${title}.md`;

  // download pics
  const downloadPromise = function (url, num) {
    return new Promise((resolve, reject) => {
      const readStream = got.stream(url);
      readStream.on("response", async (res) => {
        if (res.statusCode !== 200) {
          console.log("download pic failed: ", url);
          readStream.destroy();
          return reject({ url });
        }
        const imageTitle =
          title +
          "-" +
          new Date().getTime() +
          "-" +
          num +
          url.match(/\.[0-9a-z]+$/g);
        const imgPath = path.join(imagePath, imageTitle);
        readStream.pipe(fs.createWriteStream(imgPath));
        //   this.logger.log('success');
        return resolve({ imageTitle });
      });
    });
  };
  let downloadPicsResults = [];
  if (weiboData.largeImgs.length > 0) {
    const promiseArray = weiboData.largeImgs.map((e) => {
      return downloadPromise(e, weiboData.largeImgs.indexOf(e));
    });
    downloadPicsResults = await Promise.all(promiseArray);
  }

  // write markdown fileto the savedDataPath

  const mdFilePath = path.join(savedDataPath, mdFileName);
  // const mdFileContent = `---\r\ntitle: ${title} \r\nsite: weibo.com \r\ndate saved: ${today} \r\nuser: ${
  //   weiboData.outerUser
  // } \r\ncreated at: ${
  //   weiboData.createdAt
  // }\r\nurl: ${weibourl}\r\n---\r\n\r\n\r\n# ${title}\r\n  #weibo \r\n--- \r\n${
  //   weiboData.outerUser
  // }\r\n--- \r\n${weiboData.outerText} \r\n--- \r\n${
  //   weiboData.originUser
  // } \r\n--- \r\n${
  //   weiboData.originText
  // } \r\n--- \r\n${generatePicsMarkdownFormat(downloadPicsResults)}`;
  const weiboTemplate = fs.readFileSync(
    path.join(process.cwd(), "weibo-template.mustache"),
    "utf8"
  );
  const renderData = {
    title: title,
    site: "weibo.com",
    date_saved: today,
    user: weiboData.outerUser,
    created_at: weiboData.createdAt,
    url: weibourl,
    outer_text: weiboData.outerTextMD,
    origin_user: weiboData.originUser,
    origin_text: weiboData.originTextMD,
    pics: generatePicsMarkdownFormat(downloadPicsResults),
  };
  // disable mustache escape globally
  mustache.escape = function (value) {
    return value;
  };
  const mdFileContent = mustache.render(weiboTemplate, renderData);
  fs.writeFileSync(mdFilePath, mdFileContent);
  console.log(`write file ${mdFilePath} success`);
}

export function parseWeiboData(allData) {
  // createdAt
  const createdAt = new Date(allData.status.created_at)
    .toISOString()
    .replace(/T/, " ")
    .replace(/\..+/, "");

  var turndownService = new TurndownService();
  // 原始tweet
  let originTextMD = "";
  let outerTextMD = "";
  let isRetweet = false;
  let originUser = "";
  if (allData.status.retweeted_status) {
    isRetweet = true;
    let originText = allData.status.retweeted_status.text;
    if (
      allData.status.retweeted_status.isLongText &&
      allData.status.retweeted_status.longText
    ) {
      originText = allData.status.retweeted_status.longText.longTextContent;
    }
    // originText = weiboTextReg(originText);

    originTextMD = turndownService.turndown(originText);
    // turn html formatted originText into markdown format string

    // 原始tweet的user
    if (
      allData.status.retweeted_status.user &&
      allData.status.retweeted_status.user.screen_name
    ) {
      originUser = allData.status.retweeted_status.user.screen_name;
    } else {
      originUser = "unknown";
    }
  }
  // 最外层text
  let outerText = allData.status.text;
  //outerText = weiboTextReg(outerText);
  outerTextMD = turndownService.turndown(outerText);
  // 最外层text的user
  let outerUser = "";
  if (allData.status.user && allData.status.user.screen_name) {
    outerUser = allData.status.user.screen_name;
  } else {
    outerUser = "unknown";
  }

  // 图片链接
  let allPics = [];
  if (isRetweet) {
    allPics = allData.status.retweeted_status.pics;
  } else {
    allPics = allData.status.pics;
  }

  let largeImgs = [];
  if (allPics && allPics.length > 0) {
    largeImgs = allPics.map((e) => {
      if (e.large) {
        return e.large.url;
      }
      return e.url;
    });
  }
  // 转发的最外层有图片
  // check if the outerText contains '<span class="surl-text">查看图片</span>'
  if (outerText.includes('<span class="surl-text">查看图片</span>')) {
    // extract url from outerText, url is after 'href=' and starts with 'https://weibo.cn/sinaurl?u='
    // there may have multiple urls
    const hrefs = outerText.match(/href="([^"]+)"/g);
    if (hrefs) {
      hrefs.forEach((href) => {
        const url = href.split('"')[1];
        if (url.startsWith("https://weibo.cn/sinaurl?u=")) {
          largeImgs.push(url);
        }
      });
    }
  }

  //<a  href="https://weibo.cn/sinaurl?u=https%3A%2F%2Fwx3.sinaimg.cn%2Flarge%2F4911870fly1hq27k8jgd1j20zo07o75b.jpg" data-hide=""><span class='url-icon'><img style='width: 1rem;height: 1rem' src='https://h5.sinaimg.cn/upload/2015/01/21/20/timeline_card_small_photo_default.png'></span><span class="surl-text">查看图片</span></a>"

  // 视频页面链接
  let videoPageUrls = [];
  let mixContentUrls = [];
  if (allData.status.mix_media_ids && allData.status.mix_media_ids.length > 0) {
    mixContentUrls = allData.status.mix_media_ids;
  }
  if (
    isRetweet &&
    allData.status.retweeted_status.mix_media_ids &&
    allData.status.retweeted_status.mix_media_ids.length > 0
  ) {
    mixContentUrls = allData.status.retweeted_status.mix_media_ids;
  }
  mixContentUrls.forEach((e) => {
    // return if the url starts with 'http://t.cn/'
    if (e.startsWith("http://t.cn/")) {
      videoPageUrls.push(e);
    }
  });

  return {
    originTextMD,
    originUser,
    outerTextMD,
    outerUser,
    largeImgs,
    createdAt,
    videoPageUrls,
  };
}

export function generatePicsMarkdownFormat(picArray) {
  if (picArray.length > 0) {
    let result = [];
    picArray.forEach((picUrl) => {
      if (picUrl.url) {
        result.push(`![](${picUrl})`);
      }
      if (picUrl.imageTitle) {
        result.push(`![](./images/${picUrl.imageTitle})`);
      }
    });
    return result.join("\r\n");
  }
  return "";
}
