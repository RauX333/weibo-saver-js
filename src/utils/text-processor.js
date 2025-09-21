/**
 * Text processing utilities for the Weibo Saver application
 * Provides functions for processing text content from Weibo and RedNote posts
 */
import { logger } from './logger.js';

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
    
    const url = linkParts[1].split('">')[ 0];
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

/**
 * Extract RedNote URL from email subject or body
 * @param {string} text - Text to extract URL from
 * @returns {string|null} - Extracted RedNote URL or null if not found
 */
export function extractRedNoteUrl(text) {
  try {
    const redNoteUrlPattern = /http:\/\/xhslink\.com\/[a-zA-Z0-9\/]+/;
    const matches = text.match(redNoteUrlPattern);
    return matches ? matches[0] : null;
  } catch (error) {
    logger.error('Error extracting RedNote URL', error);
    return null;
  }
}

/**
 * Check if text contains RedNote share pattern
 * @param {string} text - Text to check
 * @returns {boolean} - Whether the text contains RedNote share pattern
 */
export function isRedNoteShare(text) {
  return text.includes('小红书笔记') && 
         text.includes('复制本条信息，打开【小红书】App查看精彩内容');
}

/**
 * Clean RedNote text by removing unwanted elements
 * @param {string} text - Raw text from RedNote post
 * @returns {string} - Cleaned text
 */
export function cleanRedNoteText(text) {
  return text
    .replace(/[\r\n]+/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

export default {
  // Weibo functions
  extractWeiboUrlFromMailBody,
  cleanWeiboText,
  createFilenameFromTitle,
  truncateText,
  generatePostTitle,
  
  // RedNote functions
  extractRedNoteUrl,
  isRedNoteShare,
  cleanRedNoteText
};