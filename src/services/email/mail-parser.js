/**
 * Email parsing service for the Weibo Saver application
 * Extracts relevant information from incoming emails
 */
import { extractWeiboUrlFromMailBody } from '../../utils/text-processor.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/config.js';

/**
 * Parse an email and extract relevant information
 * @param {Object} mail - The email object from the mail listener
 * @returns {Object|null} - Parsed email data or null if not relevant
 */
export function parseEmail(mail) {
  try {
    const fromAddress = mail.from.value[0].address;
    const mailDate = mail.date;
    const subject = mail.subject;
    const mailBody = mail.html;

    
    // Check if the email is from an allowed sender and has the correct subject
    const allowedFrom = config.mail.allowedFrom;
    const subjectFilter = config.weibo.subjectFilter;
    
    if (!allowedFrom.includes(fromAddress) || !subject.includes(subjectFilter)) {
      logger.info('Skipping email - not from allowed sender or wrong subject', {
        from: fromAddress,
        subject: subject
      });
      return null;
    }
    
    
    // Extract Weibo URL from the email body
    const weiboUrl = extractWeiboUrlFromMailBody(mailBody);
    
    if (!weiboUrl) {
      logger.warn('Could not extract Weibo URL from email', {
        from: fromAddress,
        subject: subject
      });
      return null;
    }
    
    logger.info('Successfully parsed email with Weibo content', {
      from: fromAddress,
      subject: subject,
      weiboUrl: weiboUrl
    });
    
    return {
      fromAddress,
      mailDate,
      subject,
      mailBody,
      weiboUrl
    };
  } catch (error) {
    logger.error('Error parsing email', error);
    return null;
  }
}

/**
 * Check if an email is relevant for processing
 * @param {Object} mail - The email object from the mail listener
 * @returns {boolean} - Whether the email is relevant
 */
export function isRelevantEmail(mail) {
  try {
    const fromAddress = mail.from.value[0].address;
    const subject = mail.subject;
    
    const allowedFrom = config.mail.allowedFrom;
    const subjectFilter = config.weibo.subjectFilter;
    
    return allowedFrom.includes(fromAddress) && subject.includes(subjectFilter);
  } catch (error) {
    logger.error('Error checking email relevance', error);
    return false;
  }
}

export default {
  parseEmail,
  isRelevantEmail
};