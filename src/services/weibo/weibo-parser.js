/**
 * Weibo content parsing service for the Weibo Saver application
 * Extracts structured data from raw Weibo content
 */
import { cleanWeiboText, generatePostTitle } from '../../utils/text-processor.js';
import { logger } from '../../utils/logger.js';
import TurndownService from 'turndown';

// Initialize Turndown service for HTML to Markdown conversion
const turndownService = new TurndownService();

/**
 * Parse raw Weibo data into a structured format
 * @param {Object} rawData - The raw data from Weibo API/page
 * @returns {Object} - Structured Weibo data
 */
export function parseWeiboData(rawData) {
  try {
    logger.info('Parsing Weibo data');
    
    // Extract status data from the raw data
    const status = rawData.status;
    if (!status) {
      throw new Error('Invalid Weibo data structure');
    }
    
    // Extract user information
    const user = status.user || {};
    const userName = user.screen_name || 'Unknown';
    
    // Extract post content
    let text = status.text || status.longText?.longTextContent || '';
    text = cleanWeiboText(text);
    const textMD = turndownService.turndown(text);
    
    // Extract media content
    const pics = status.pics || [];
    const largeImgs = pics.map(pic => pic.large?.url || pic.url).filter(Boolean);
    
    // Extract video content
    const videoPageUrls = [];
    if (status.page_info && status.page_info.type === 'video') {
      const videoUrl = status.page_info.media_info?.stream_url || 
                       status.page_info.media_info?.h5_url || 
                       status.page_info.page_url;
      if (videoUrl) {
        videoPageUrls.push(videoUrl);
      }
    }
    
    // Extract retweeted content if available
    let retweetData = {};
    if (status.retweeted_status) {
      const retweetStatus = status.retweeted_status;
      const retweetUser = retweetStatus.user || {};
      const retweetUserName = retweetUser.screen_name || 'Unknown';
      
      let retweetText = retweetStatus.text || retweetStatus.longText?.longTextContent || '';
      retweetText = cleanWeiboText(retweetText);
      const retweetTextMD = turndownService.turndown(retweetText);
      
      // Extract retweeted media
      const retweetPics = retweetStatus.pics || [];
      const retweetLargeImgs = retweetPics.map(pic => pic.large?.url || pic.url).filter(Boolean);
      largeImgs.push(...retweetLargeImgs);
      
      // Extract retweeted video
      if (retweetStatus.page_info && retweetStatus.page_info.type === 'video') {
        const videoUrl = retweetStatus.page_info.media_info?.stream_url || 
                         retweetStatus.page_info.media_info?.h5_url || 
                         retweetStatus.page_info.page_url;
        if (videoUrl) {
          videoPageUrls.push(videoUrl);
        }
      }
      
      retweetData = {
        originTextMD: retweetTextMD,
        originUser: retweetUserName
      };
    }
    
    // Create timestamp
    const createdAt = new Date(status.created_at).toISOString().replace(/T/, ' ').replace(/\.+/, '');
    
    // Combine all data
    const weiboData = {
      outerTextMD: textMD,
      outerUser: userName,
      largeImgs,
      createdAt,
      videoPageUrls,
      ...retweetData
    };
    
    // If there's no retweet data, set default values
    if (!weiboData.originTextMD) {
      weiboData.originTextMD = '';
      weiboData.originUser = '';
    }
    
    logger.info('Successfully parsed Weibo data');
    return weiboData;
  } catch (error) {
    logger.error('Error parsing Weibo data', { error });
    throw error;
  }
}

/**
 * Generate a title for the Weibo post
 * @param {Object} weiboData - The structured Weibo data
 * @returns {string} - Generated title
 */
export function generateWeiboTitle(weiboData) {
  return generatePostTitle(weiboData.outerTextMD, weiboData.outerUser);
}

export default {
  parseWeiboData,
  generateWeiboTitle
};