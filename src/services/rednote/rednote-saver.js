

/**
 * RedNote post saving service
 * Handles saving RedNote posts to the filesystem
 */
import path from 'path';
import { fetchRedNoteContent, createFallbackRedNoteData } from './rednote-fetcher.js';
import { parseRedNoteData, generateRedNoteFileTitle } from './rednote-parser.js';
import { downloadImages, downloadVideos } from '../storage/media-downloader.js';
import { createDirectoryStructure, saveToFile, generateUniqueFilename } from '../storage/file-manager.js';
import { generateMarkdown } from '../storage/template-renderer.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/config.js';

/**
 * Process a RedNote post from email data
 * @param {Object} emailData - Parsed email data
 * @returns {Promise<void>}
 */
export async function processRedNotePost(emailData) {
  try {
    logger.info('Processing RedNote post', { redNoteUrl: emailData.redNoteUrl });
    
    // Create directory structure for saving content
    const paths = createDirectoryStructure();
    
    // Fetch RedNote content
    let redNoteRawData;
    let redNoteData;
    
    try {
      redNoteRawData = await fetchRedNoteContent(emailData.redNoteUrl);
      redNoteData = parseRedNoteData(redNoteRawData);
    } catch (error) {
      logger.error('Error fetching or parsing RedNote content, using fallback', { error: error.message });
      redNoteData = createFallbackRedNoteData(error, emailData.mailBody);
    }
    
    // Generate title for the post
    const fileTitle = generateRedNoteFileTitle(redNoteData);
    
    // Download images
    const downloadedImages = [];
    if (redNoteData.images && redNoteData.images.length > 0) {
      const imageFilenames = await downloadImages(redNoteData.images, paths.imagePath, fileTitle);
      downloadedImages.push(...imageFilenames);
    }
    
    // Download videos
    const downloadedVideos = [];
    if (redNoteData.videos && redNoteData.videos.length > 0) {
      const videoFilenames = await downloadVideos(redNoteData.videos, paths.videoPath, fileTitle);
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
      title: redNoteData.title,
      date_saved: new Date().toISOString().replace(/T/, ' ').replace(/\.+/, ''),
      author: redNoteData.author,
      created_at: redNoteData.createdAt,
      url: emailData.redNoteUrl,
      text: redNoteData.text,
      pics: imageMarkdown,
      videos: videoMarkdown
    };
    
    // Generate Markdown content
    const markdownContent = await generateMarkdown(
      config.rednote.templatePath, // Path to the template file
      templateData
    );
    
    // Generate unique filename and save content
    const mdFilename = generateUniqueFilename(paths.datePath, fileTitle);
    const mdFilePath = path.join(paths.datePath, mdFilename);
    await saveToFile(mdFilePath, markdownContent);
    
    logger.info('Successfully processed and saved RedNote post', {
      fileTitle,
      mdFilePath,
      imageCount: downloadedImages.length,
      videoCount: downloadedVideos.length
    });
  } catch (error) {
    logger.error('Error processing RedNote post', { error: error.message, emailData });
    throw error;
  }
}