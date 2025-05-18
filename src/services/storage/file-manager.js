/**
 * File management service for the Weibo Saver application
 * Handles creating directories and managing file operations
 */
import fs from 'fs';
import path from 'path';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/config.js';

/**
 * Create the directory structure for storing Weibo content
 * @returns {Object} - Object containing paths to created directories
 */
export function createDirectoryStructure() {
  try {
    logger.info('Creating directory structure for content storage');
    
    // Get current date for directory naming
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    // Create base directory structure
    const basePath = config.storage.basePath;
    const yearPath = path.join(basePath, year);
    const monthPath = path.join(yearPath, month);
    const datePath = path.join(monthPath, dateString);
    const imagePath = path.join(datePath, 'images');
    const videoPath = path.join(datePath, 'videos');
    
    // Create directories if they don't exist
    const directories = [basePath, yearPath, monthPath, datePath, imagePath, videoPath];
    
    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      }
    }
    
    logger.info('Directory structure created successfully');
    
    return {
      basePath,
      yearPath,
      monthPath,
      datePath,
      imagePath,
      videoPath
    };
  } catch (error) {
    logger.error('Error creating directory structure', { error });
    throw error;
  }
}

/**
 * Save content to a file
 * @param {string} filePath - Path to save the file
 * @param {string} content - Content to write to the file
 * @returns {Promise<void>}
 */
export function saveToFile(filePath, content) {
  return new Promise((resolve, reject) => {
    logger.info('Saving content to file', { filePath });
    
    fs.writeFile(filePath, content, 'utf8', (error) => {
      if (error) {
        logger.error('Error saving file', { filePath, error });
        return reject(error);
      }
      
      logger.info('File saved successfully', { filePath });
      resolve();
    });
  });
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to check
 * @returns {boolean} - Whether the file exists
 */
export function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Generate a unique filename if the original already exists
 * @param {string} basePath - Base directory path
 * @param {string} filename - Original filename
 * @param {string} extension - File extension
 * @returns {string} - Unique filename
 */
export function generateUniqueFilename(basePath, filename, extension = '.md') {
  let uniqueFilename = `${filename}${extension}`;
  let filePath = path.join(basePath, uniqueFilename);
  let counter = 1;
  
  while (fileExists(filePath)) {
    uniqueFilename = `${filename}-${counter}${extension}`;
    filePath = path.join(basePath, uniqueFilename);
    counter++;
  }
  
  return uniqueFilename;
}

export default {
  createDirectoryStructure,
  saveToFile,
  fileExists,
  generateUniqueFilename
};