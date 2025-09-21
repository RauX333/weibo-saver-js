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
export function renderTemplate(template, templateData) {
  try {
    logger.info('Rendering template with data');
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
export async function generateMarkdown(template,data) {
  try {
   
    const loadedTemplate = await loadTemplate(template);
    
    // Render template with data
    return renderTemplate(loadedTemplate, data);
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