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
  //console.log(allData);
  const weiboData = parseWeiboData(allData);

  //get today's date in the format YYYY-MM-DD, timezone is utc8
  const today = new Date().toISOString().substr(0, 10);
  // see if folder exists at ./saved_data
  const savedDataPath = path.join(process.cwd(), `saved_data/${today}`);
  const imagePath = path.join(savedDataPath,'images')
  if (!fs.existsSync(savedDataPath)) {
    fs.mkdirSync(savedDataPath);
  }
  if (!fs.existsSync(imagePath)) {
    fs.mkdirSync(imagePath);
  }

  // generate md file title
  let title = weiboData.outerText;
  if (weiboData.outerText.length > 30) {
    title = weiboData.outerText.substring(0, 30);
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
          return reject({url});
        }
        const imageTitle = "image-" +
        new Date().getTime() +
        "-" +
        num +
        url.match(/\.[0-9a-z]+$/g)
        const imgPath = path.join(
          imagePath,
          imageTitle
        );
        readStream.pipe(fs.createWriteStream(imgPath));
        //   this.logger.log('success');
        return resolve({imageTitle});
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

  // write to the savedDataPath
  const mdFilePath = path.join(savedDataPath, mdFileName);
  const mdFileContent = `---\r\ntitle: ${title} \r\nsite: weibo.com \r\ndate saved: ${today} \r\nuser: ${
    weiboData.outerUser
  } \r\ncreated at: ${
    weiboData.createdAt
  }\r\nurl: ${weibourl}\r\n---\r\n\r\n\r\n# ${title}\r\n  #weibo \r\n---\r\n${
    weiboData.outerUser
  }\r\n---\r\n${weiboData.outerText} \r\n--- \r\n${weiboData.originUser} \r\n---\r\n${
    weiboData.originText
  } \r\n--- \r\n${generatePicsMarkdownFormat(downloadPicsResults)}`;
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
  let originText = "";
  let isRetweet = false;
  let originUser = "";
  if (allData.status.retweeted_status) {
    isRetweet = true;
    originText = allData.status.retweeted_status.text;
    if (allData.status.retweeted_status.isLongText) {
      originText = allData.status.retweeted_status.longText.longTextContent;
    }
    // originText = weiboTextReg(originText);

    originText = turndownService.turndown(originText);
    // turn html formatted originText into markdown format string

    // 原始tweet的user
    originUser = allData.status.retweeted_status.user.screen_name;
  }
  // 最外层text
  let outerText = allData.status.text;
  //outerText = weiboTextReg(outerText);
  outerText = turndownService.turndown(outerText);
  // 最外层text的user
  const outerUser = allData.status.user.screen_name;

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
  return { originText, originUser, outerText, outerUser, largeImgs, createdAt };
}

export function generatePicsMarkdownFormat(picArray) {
  if (picArray.length > 0) {
    let result = [];
    picArray.forEach((picUrl) => {
      if(picUrl.url) {
        result.push(`![](${picUrl})`);
      }
      if(picUrl.imageTitle) {
        result.push(`![](./images/${picUrl.imageTitle})`);
      }
    });
    return result.join("\r\n");
  }
  return "";
}
