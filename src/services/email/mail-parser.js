/**
 * Email parsing service for the Weibo Saver application
 * Extracts relevant information from incoming emails
 */
import { extractWeiboUrlFromMailBody, extractRedNoteUrl, isRedNoteShare } from '../../utils/text-processor.js';
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

    
    // Check if the email is from an allowed sender
    const allowedFrom = config.mail.allowedFrom;
    if (!allowedFrom.includes(fromAddress)) {
      logger.info('Skipping email - not from allowed sender', { from: fromAddress });
      return null;
    }

    // Check for RedNote content
    const redNoteSubjectFilter = config.rednote.subjectFilter;
    if (subject.includes(redNoteSubjectFilter)) {
      const redNoteUrl = extractRedNoteUrl(mailBody);
      if (!redNoteUrl) {
        logger.warn('Could not extract RedNote URL from email', {
          from: fromAddress,
          subject: subject
        });
        return null;
      }

      logger.info('Successfully parsed email with RedNote content', {
        from: fromAddress,
        subject: subject,
        redNoteUrl: redNoteUrl
      });

      return {
        fromAddress,
        mailDate,
        subject,
        mailBody,
        redNoteUrl,
        type: 'rednote'
      };
    }

    // Check for Weibo content
    const weiboSubjectFilter = config.weibo.subjectFilter;
    if (subject.includes(weiboSubjectFilter)) {
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
      weiboUrl,
      type: 'weibo'
    };
      
    }

    
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
    if (!allowedFrom.includes(fromAddress)) return false;
    
    // Check for either RedNote or Weibo content
    return subject.includes(redNoteSubjectFilter) || subject.includes(config.weibo.subjectFilter);
  } catch (error) {
    logger.error('Error checking email relevance', error);
    return false;
  }
}

export default {
  parseEmail,
  isRelevantEmail
};