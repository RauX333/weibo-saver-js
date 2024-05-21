export function getWeiboURLFromMailBody(bodyHtml) {
    const preString = '更多精彩评论:'
    const weiboUrlPre = "https://weibo.com/"
    const mWeiboPre = "https://m.weibo.cn/status/"
    // find url from html format bodyHtml, the url is in a html <a> tag, the <a> tag is behind preString "更多精彩评论:". There may have multiple preStrings and <a> tags inthe txt., we need the last one. The url must started with "https://weibo.com/".
    const url = bodyHtml.split(preString).pop().split('<a href="')[1].split('">')[0]
    if (!url.startsWith(weiboUrlPre)) {    // check if url starts with "https://weibo.com/"
        return null
    }
    // get numbers after last / of the url
    const lastSlashIndex = url.lastIndexOf("/")
    const weiboId = url.substring(lastSlashIndex+1)

    return mWeiboPre + weiboId
}

export function weiboTextReg(text) {
    return text
      .replace(/src="(.*?)"?\/?>/g, '')
      .replace(/<span.*?\/?>/g, '')
      .replace(/<a.*?\/?>/g, '')
      .replace(/<\/span>/g, '')
      .replace(/<\/a>/g, '')
      .replace(/<img alt=/g, '');
  }
  
  export function filenameTitleFilter(text) {
    // make the text a valid filename for macox&windows&linux file system
    text = text.replace(/[\\\\/:*?\"<>|]/g, '');

    // remove # in the text
    text = text.replace(/#/g, '');
    // delete all whitespace
    text = text.replace(/\s/g, '');
    return text
  }