/**
 * Weibo content fetching service for the Weibo Saver application
 * Retrieves content from Weibo URLs
 */
import got from 'got';
import { JSDOM } from 'jsdom';
import { logger } from '../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Fetch Weibo content from a URL
 * @param {string} weiboUrl - The Weibo URL to fetch
 * @returns {Object} - The fetched Weibo data
 */
export async function fetchWeiboContent(weiboUrl) {
  try {
    logger.info('Fetching Weibo content', { url: weiboUrl });
    
    const response = await got.get(weiboUrl);
    const pageBody = new JSDOM(response.body, {
      runScripts: 'dangerously',
      resources: 'usable'
    });
    
    // Extract data from the page
    const allData = pageBody.window.$render_data;
    if (!allData) {
      throw new Error('Could not extract Weibo data from page');
    }
    
    logger.info('Successfully fetched Weibo content');
    return allData;
  } catch (error) {
    logger.error('Error fetching Weibo content', { error, url: weiboUrl });
    throw error;
  }
}

/**
 * Handle errors during Weibo fetching by creating a fallback data object
 * @param {Error} error - The error that occurred
 * @param {string} mailBody - The original email body (for fallback content)
 * @returns {Object} - Fallback Weibo data
 */
export function createFallbackWeiboData(error, mailBody) {
  logger.warn('Creating fallback Weibo data due to error', { error });
  
  return {
    originTextMD: mailBody,
    originUser: 'MailBody',
    outerTextMD: uuidv4() + error.message,
    outerUser: 'Error',
    largeImgs: '',
    createdAt: new Date().toISOString().replace(/T/, ' ').replace(/\.+/, ''),
    videoPageUrls: []
  };
}

export default {
  fetchWeiboContent,
  createFallbackWeiboData
};