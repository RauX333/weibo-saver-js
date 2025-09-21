/**
 * Media downloading service for the Weibo Saver application
 * Handles downloading images and videos from Weibo posts
 */
import fs from 'fs';
import path from 'path';
import got from 'got';
import { logger } from '../../utils/logger.js';

/**
 * Download an image from a URL
 * @param {string} url - The image URL
 * @param {string} imagePath - The directory to save the image to
 * @param {string} imageTitle - The filename for the image
 * @returns {Promise<Object>} - Object containing the image title
 */
export function downloadImage(url, imagePath, imageTitle) {
  return new Promise((resolve, reject) => {
    logger.info('Downloading image', { url, imageTitle });
    
    const readStream = got.stream(url);
    readStream.on('response', async (res) => {
      if (res.statusCode !== 200) {
        logger.error('Failed to download image', { url, statusCode: res.statusCode });
        readStream.destroy();
        return reject({ url });
      }
      
      const imgPath = path.join(imagePath, imageTitle);
      const writeStream = fs.createWriteStream(imgPath);
      readStream.pipe(writeStream);
      
      writeStream.on('finish', () => {
        logger.info('Successfully downloaded image', { imageTitle });
        resolve({ imageTitle });
      });
      
      writeStream.on('error', (error) => {
        logger.error('Error writing image file', { url, imageTitle, error });
        reject({ url, error });
      });
    });
    
    readStream.on('error', (error) => {
      logger.error('Error downloading image', { url, error });
      reject({ url, error });
    });
  });
}

/**
 * Download multiple images from URLs
 * @param {Array<string>} urls - Array of image URLs
 * @param {string} imagePath - The directory to save images to
 * @param {string} baseTitle - Base title to use for image filenames
 * @returns {Promise<Array<string>>} - Array of downloaded image titles
 */
export async function downloadImages(urls, imagePath, baseTitle) {
  try {
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      logger.warn('No image URLs provided for download');
      return [];
    }
    
    logger.info('Downloading multiple images', { count: urls.length });
    
    const downloadPromises = urls.map((url, index) => {
      if (!url || typeof url !== 'string') {
        logger.warn('Invalid image URL', { url });
        return Promise.resolve({ imageTitle: null });
      }
      
      // Extract file extension or default to .jpg
      const extension = url.match(/\.[0-9a-z]+$/i)?.[0] || '.jpg';
      const imageTitle = `${baseTitle}-${Date.now()}-${index}${extension}`;
      return downloadImage(url, imagePath, imageTitle);
    });
    
    const results = await Promise.allSettled(downloadPromises);
    
    // Filter successful downloads
    const successfulDownloads = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value.imageTitle);
    
    // Log failed downloads
    const failedDownloads = results
      .filter(result => result.status === 'rejected')
      .map(result => result.reason.url);
    
    if (failedDownloads.length > 0) {
      logger.warn('Some images failed to download', { failedUrls: failedDownloads });
    }
    
    logger.info('Completed downloading images', { 
      total: urls.length, 
      successful: successfulDownloads.length, 
      failed: failedDownloads.length 
    });
    
    return successfulDownloads;
  } catch (error) {
    logger.error('Error in batch image download', error);
    throw error;
  }
}

/**
 * Download a video from a URL
 * @param {string} url - The video URL
 * @param {string} videoPath - The directory to save the video to
 * @param {string} videoTitle - The filename for the video
 * @returns {Promise<Object>} - Object containing the video title
 */
export function downloadVideo(url, videoPath, videoTitle) {
  return new Promise((resolve, reject) => {
    logger.info('Downloading video', { url, videoTitle });
    
    const readStream = got.stream(url);
    readStream.on('response', async (res) => {
      if (res.statusCode !== 200) {
        logger.error('Failed to download video', { url, statusCode: res.statusCode });
        readStream.destroy();
        return reject({ url });
      }
      
      const videoFilePath = path.join(videoPath, videoTitle);
      const writeStream = fs.createWriteStream(videoFilePath);
      readStream.pipe(writeStream);
      
      writeStream.on('finish', () => {
        logger.info('Successfully downloaded video', { videoTitle });
        resolve({ videoTitle });
      });
      
      writeStream.on('error', (error) => {
        logger.error('Error writing video file', { url, videoTitle, error });
        reject({ url, error });
      });
    });
    
    readStream.on('error', (error) => {
      logger.error('Error downloading video', { url, error });
      reject({ url, error });
    });
  });
}

/**
 * Download multiple videos from URLs
 * @param {Array<string>} urls - Array of video URLs
 * @param {string} videoPath - The directory to save videos to
 * @param {string} baseTitle - Base title to use for video filenames
 * @returns {Promise<Array<string>>} - Array of downloaded video titles
 */
export async function downloadVideos(urls, videoPath, baseTitle) {
  try {
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      logger.warn('No video URLs provided for download');
      return [];
    }
    
    logger.info('Downloading multiple videos', { count: urls.length });
    
    const downloadPromises = urls.map((url, index) => {
      if (!url || typeof url !== 'string') {
        logger.warn('Invalid video URL', { url });
        return Promise.resolve({ videoTitle: null });
      }
      
      const videoTitle = `${baseTitle}-${Date.now()}-${index}.mp4`;
      return downloadVideo(url, videoPath, videoTitle);
    });
    
    const results = await Promise.allSettled(downloadPromises);
    
    // Filter successful downloads
    const successfulDownloads = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value.videoTitle);
    
    // Log failed downloads
    const failedDownloads = results
      .filter(result => result.status === 'rejected')
      .map(result => result.reason.url);
    
    if (failedDownloads.length > 0) {
      logger.warn('Some videos failed to download', { failedUrls: failedDownloads });
    }
    
    logger.info('Completed downloading videos', { 
      total: urls.length, 
      successful: successfulDownloads.length, 
      failed: failedDownloads.length 
    });
    
    return successfulDownloads;
  } catch (error) {
    logger.error('Error in batch video download', error);
    throw error;
  }
}

export default {
  downloadImage,
  downloadImages,
  downloadVideo,
  downloadVideos
};