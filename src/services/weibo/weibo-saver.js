import path from 'path';
import { fetchWeiboContent, createFallbackWeiboData } from './weibo-fetcher.js';
import { parseWeiboData, generateWeiboTitle } from './weibo-parser.js';
import { downloadImages, downloadVideos } from '../storage/media-downloader.js';
import { createDirectoryStructure, saveToFile, generateUniqueFilename } from '../storage/file-manager.js';
import { generateMarkdown } from '../storage/template-renderer.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/config.js';
/**
 * Process a Weibo post from email data
 * @param {Object} emailData - Parsed email data
 * @returns {Promise<void>}
 */
export async function processWeiboPost(emailData) {
    try {
      logger.info('Processing Weibo post', { weiboUrl: emailData.weiboUrl });
      
      // Create directory structure for saving content
      const paths = createDirectoryStructure();
      
      // Fetch Weibo content
      let weiboRawData;
      let weiboData;
      
      try {
        weiboRawData = await fetchWeiboContent(emailData.weiboUrl);
        weiboData = parseWeiboData(weiboRawData);
      } catch (error) {
        logger.error('Error fetching or parsing Weibo content, using fallback', error );
        weiboData = createFallbackWeiboData(error, emailData.mailBody);
      }
      
      // Generate title for the post
      const title = generateWeiboTitle(weiboData);
      
      // Download images
      const downloadedImages = [];
      if (weiboData.largeImgs && weiboData.largeImgs.length > 0) {
        const imageFilenames = await downloadImages(weiboData.largeImgs, paths.imagePath, title);
        downloadedImages.push(...imageFilenames);
      }
      
      // Download videos
      const downloadedVideos = [];
      if (weiboData.videoPageUrls && weiboData.videoPageUrls.length > 0) {
        const videoFilenames = await downloadVideos(weiboData.videoPageUrls, paths.videoPath, title);
        downloadedVideos.push(...videoFilenames);
      }

      // Generate image markdown
    const imageMarkdown = downloadedImages.map(filename => {
      return `![${filename}](images/${filename})`;
    }).join('\n\n');
    
    // Generate video markdown
    const videoMarkdown = downloadedVideos.map(filename => {
      return `[${filename}](videos/${filename})`;
    }).join('\n\n');
    
    // Prepare template data
    const templateData = {
      title: weiboData.outerUser + '的微博',
      site: 'weibo.com',
      date_saved: new Date().toISOString().replace(/T/, ' ').replace(/\.+/, ''),
      user: weiboData.outerUser,
      created_at: weiboData.createdAt,
      url: emailData.weiboUrl,
      outer_text: weiboData.outerTextMD,
      origin_user: weiboData.originUser,
      origin_text: weiboData.originTextMD,
      pics: imageMarkdown,
      videos: videoMarkdown
    };
      
      // Generate Markdown content
      const markdownContent = await generateMarkdown(
        config.weibo.templatePath,
        templateData,
      );
      
      // Generate unique filename and save content
      const mdFilename = generateUniqueFilename(paths.datePath, title);
      const mdFilePath = path.join(paths.datePath, mdFilename);
      await saveToFile(mdFilePath, markdownContent);
      
      logger.info('Successfully processed and saved Weibo post', {
        title,
        mdFilePath,
        imageCount: downloadedImages.length,
        videoCount: downloadedVideos.length
      });
    } catch (error) {
      logger.error('Error processing Weibo post', { error, emailData });
    }
  }