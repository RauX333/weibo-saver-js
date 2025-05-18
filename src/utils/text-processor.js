/**
 * Text processing utilities for the Weibo Saver application
 * Provides functions for processing text content from Weibo posts
 */

/**
 * Extract Weibo URL from email body HTML
 * @param {string} bodyHtml - HTML content of the email body
 * @returns {string|null} - Extracted Weibo URL or null if not found
 */
export function extractWeiboUrlFromMailBody(bodyHtml) {
  try {
    const preString = '更多精彩评论:';
    const weiboUrlPre = "https://weibo.com/";
    const mWeiboPre = "https://m.weibo.cn/status/";
    
    // Find URL from HTML format bodyHtml
    // The URL is in an HTML <a> tag that appears after preString
    const urlPart = bodyHtml.split(preString).pop();
    if (!urlPart) return null;
    
    const linkParts = urlPart.split('<a href="');
    if (linkParts.length < 2) return null;
    
    const url = linkParts[1].split('">')[0];
    if (!url.startsWith(weiboUrlPre)) {
      return null;
    }
    
    // Extract Weibo ID from the URL
    const lastSlashIndex = url.lastIndexOf("/");
    let weiboId = url.substring(lastSlashIndex + 1);
    if (weiboId.includes('"')) {
      weiboId = weiboId.split('"')[0];
    }
    
    return mWeiboPre + weiboId;
  } catch (error) {
    // If any error occurs during extraction, return null
    return null;
  }
}

/**
 * Clean Weibo text by removing HTML tags and other unwanted elements
 * @param {string} text - Raw text from Weibo post
 * @returns {string} - Cleaned text
 */
export function cleanWeiboText(text) {
  return text
    .replace(/src="(.*?)"?\/?>/g, '')
    .replace(/<span.*?\/?>/g, '')
    .replace(/<a.*?\/?>/g, '')
    .replace(/<\/span>/g, '')
    .replace(/<\/a>/g, '')
    .replace(/<img alt=/g, '');
}

/**
 * Filter a title to make it suitable for use as a filename
 * @param {string} text - Original title text
 * @returns {string} - Filtered title suitable for filenames
 */
export function createFilenameFromTitle(text) {
  // Remove characters that are invalid in filenames across operating systems
  let filtered = text.replace(/[\\\/:*?"<>|]/g, '');
  
  // Remove # symbols
  filtered = filtered.replace(/#/g, '');
  
  // Remove URLs starting with (https
  filtered = filtered.split('(https')[0];
  
  // Remove wiki-style links starting with ![[
  filtered = filtered.split('![[')[0];
  
  // Remove all whitespace
  filtered = filtered.replace(/\s/g, '');
  
  return filtered;
}

/**
 * Truncate text to a specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export function truncateText(text, maxLength = 40) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength);
}

/**
 * Generate a title for a Weibo post
 * @param {string} text - Post text content
 * @param {string} username - Username of the poster
 * @param {number} [maxLength=40] - Maximum length for the title
 * @returns {string} - Generated title
 */
export function generatePostTitle(text, username, maxLength = 40) {
  const truncatedText = truncateText(text, maxLength);
  const title = `${username}-${truncatedText}`;
  return createFilenameFromTitle(title);
}

export default {
  extractWeiboUrlFromMailBody,
  cleanWeiboText,
  createFilenameFromTitle,
  truncateText,
  generatePostTitle,
};