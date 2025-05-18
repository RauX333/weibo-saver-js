/**
 * Template rendering service for the Weibo Saver application
 * Handles generating Markdown content from Weibo data
 */
import fs from 'fs';
import path from 'path';
import mustache from 'mustache';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/config.js';

/**
 * Load a template file
 * @param {string} templatePath - Path to the template file
 * @returns {Promise<string>} - Template content
 */
export function loadTemplate(templatePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(templatePath, 'utf8', (error, data) => {
      if (error) {
        logger.error('Error loading template', { templatePath, error });
        return reject(error);
      }
      
      logger.info('Template loaded successfully', { templatePath });
      resolve(data);
    });
  });
}

/**
 * Render a template with Weibo data
 * @param {string} template - Template content
 * @param {Object} weiboData - Structured Weibo data
 * @param {Array<string>} imageFilenames - Array of downloaded image filenames
 * @param {Array<string>} videoFilenames - Array of downloaded video filenames
 * @param {string} weiboUrl - Original Weibo URL
 * @returns {string} - Rendered content
 */
export function renderTemplate(template, weiboData, imageFilenames = [], videoFilenames = [], weiboUrl = '') {
  try {
    logger.info('Rendering template with Weibo data');
    
    // Generate image markdown
    const imageMarkdown = imageFilenames.map(filename => {
      return `![${filename}](images/${filename})`;
    }).join('\n\n');
    
    // Generate video markdown
    const videoMarkdown = videoFilenames.map(filename => {
      return `[${filename}](videos/${filename})`;
    }).join('\n\n');
    
    // Prepare template data
    const templateData = {
      title: weiboData.outerUser + '的微博',
      site: 'weibo.com',
      date_saved: new Date().toISOString().replace(/T/, ' ').replace(/\.+/, ''),
      user: weiboData.outerUser,
      created_at: weiboData.createdAt,
      url: weiboUrl,
      outer_text: weiboData.outerTextMD,
      origin_user: weiboData.originUser,
      origin_text: weiboData.originTextMD,
      pics: imageMarkdown,
      videos: videoMarkdown
    };
    
    // Render the template
    const rendered = mustache.render(template, templateData);
    
    logger.info('Template rendered successfully');
    return rendered;
  } catch (error) {
    logger.error('Error rendering template', error);
    throw error;
  }
}

/**
 * Generate Markdown content for a Weibo post
 * @param {Object} weiboData - Structured Weibo data
 * @param {Array<string>} imageFilenames - Array of downloaded image filenames
 * @param {Array<string>} videoFilenames - Array of downloaded video filenames
 * @param {string} weiboUrl - Original Weibo URL
 * @returns {Promise<string>} - Generated Markdown content
 */
export async function generateMarkdown(weiboData, imageFilenames = [], videoFilenames = [], weiboUrl = '') {
  try {
    // Get template path from config or use default
    const templatePath = config.storage.templatePath || path.join(process.cwd(), 'weibo-template.mustache');
    
    // Load template
    const template = await loadTemplate(templatePath);
    
    // Render template with data
    return renderTemplate(template, weiboData, imageFilenames, videoFilenames, weiboUrl);
  } catch (error) {
    logger.error('Error generating Markdown', error);
    throw error;
  }
}

export default {
  loadTemplate,
  renderTemplate,
  generateMarkdown
};