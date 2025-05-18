/**
 * Main application entry point for the Weibo Saver application
 * Integrates all services and handles the application flow
 */
import { createMailListener } from './services/email/mail-listener.js';
import { parseEmail } from './services/email/mail-parser.js';
import { fetchWeiboContent, createFallbackWeiboData } from './services/weibo/weibo-fetcher.js';
import { parseWeiboData, generateWeiboTitle } from './services/weibo/weibo-parser.js';
import { downloadImages, downloadVideos } from './services/weibo/media-downloader.js';
import { createDirectoryStructure, saveToFile, generateUniqueFilename } from './services/storage/file-manager.js';
import { generateMarkdown } from './services/storage/template-renderer.js';
import { logger } from './utils/logger.js';
import path from 'path';

/**
 * Process a Weibo post from email data
 * @param {Object} emailData - Parsed email data
 * @returns {Promise<void>}
 */
async function processWeiboPost(emailData) {
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
      logger.error('Error fetching or parsing Weibo content, using fallback', { error });
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
    
    // Generate Markdown content
    const markdownContent = await generateMarkdown(
      weiboData,
      downloadedImages,
      downloadedVideos,
      emailData.weiboUrl
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

/**
 * Start the application
 */
export function startApplication() {
  try {
    logger.info('Starting Weibo Saver application');
    
    // Create mail listener
    const mailListener = createMailListener();
    
    // Set up event handlers
    mailListener.on('server:connected', () => {
      logger.info('Connected to mail server');
    });
    
    mailListener.on('server:disconnected', () => {
      logger.error('Disconnected from mail server');
      process.exit(1);
    });
    
    mailListener.on('error', (error) => {
      logger.error('Mail listener error', { error });
      process.exit(1);
    });
    
    mailListener.on('mail', async (mail) => {
      logger.info('Received new email', { subject: mail.subject });
      
      // Parse email data
      const emailData = parseEmail(mail);
      
      // Process email if it contains Weibo content
      if (emailData) {
        await processWeiboPost(emailData);
      }
    });
    
    // Start listening for emails
    mailListener.start();
    
    // Handle application shutdown
    process.on('SIGINT', () => {
      logger.info('Application shutdown requested');
      mailListener.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      logger.info('Application termination requested');
      mailListener.stop();
      process.exit(0);
    });
    
    logger.info('Weibo Saver application started successfully');
  } catch (error) {
    logger.error('Error starting application', { error });
    process.exit(1);
  }
}

export default {
  startApplication,
  processWeiboPost
};