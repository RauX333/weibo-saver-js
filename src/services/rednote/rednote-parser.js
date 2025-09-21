/**
 * RedNote post parsing service
 * Handles parsing RedNote data and generating titles
 */
import { logger } from '../../utils/logger.js';
import { cleanRedNoteText } from '../../utils/text-processor.js';

/**
 * Parse raw RedNote data into a structured format
 * @param {Object} redNoteRawData - Raw data from RedNote fetcher
 * @returns {Object} - Structured RedNote data
 */
export function parseRedNoteData(redNoteRawData) {
  try {
    logger.info('Parsing RedNote data');
    
    return {
      text: cleanRedNoteText(redNoteRawData.text),
      images: redNoteRawData.images || [],
      videos: redNoteRawData.videos || [],
      createdAt: redNoteRawData.createdAt || new Date().toISOString(),
      author: redNoteRawData.author || 'Unknown',
      id: redNoteRawData.id || 'unknown',
      title: redNoteRawData.title || 'Untitled',
      type: 'rednote'
    };
  } catch (error) {
    logger.error('Error parsing RedNote data', { error: error.message });
    throw error;
  }
}

/**
 * Generate a title for a RedNote post
 * @param {Object} redNoteData - Structured RedNote data
 * @returns {string} - Generated title
 */
export function generateRedNoteFileTitle(redNoteData) {
  try {
    logger.info('Generating title for RedNote post');
    
    // Use the first 30 characters of text as title, or a default if no text
    let title = redNoteData.title ? redNoteData.title.substring(0, 30).trim() : redNoteData.text?redNoteData.text.substring(0, 30).trim():'RedNote Post';
    
    // Remove any invalid characters for filenames
    title = title.replace(/[\/:*?"<>|]/g, '_');
    
    // Add author and date to make title more unique
    const author = redNoteData.author || 'Unknown';
    const date = new Date(redNoteData.createdAt).toISOString().split('T')[0];
    
    return `${title}-${author}-${date}`;
  } catch (error) {
    logger.error('Error generating RedNote title', { error: error.message });
    return `${new Date().toISOString().split('T')[0]}`;
  }
}

/**
 * Process a RedNote post from email data
 * @param {Object} emailData - Parsed email data
 * @returns {Promise<void>}
 */
export async function processRedNotePost(emailData) {
  try {
    logger.info('Processing RedNote post', { redNoteUrl: emailData.redNoteUrl });
    
    // This function is now implemented in rednote-saver.js
    // This is kept here for backward compatibility
    const { processRedNotePost: saveRedNotePost } = await import('./rednote-saver.js');
    return saveRedNotePost(emailData);
  } catch (error) {
    logger.error('Error in processRedNotePost wrapper', { error: error.message, emailData });
    throw error;
  }
}