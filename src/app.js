/**
 * Main application entry point for the Weibo Saver application
 * Integrates all services and handles the application flow
 */
import { createMailListener } from './services/email/mail-listener.js';
import { parseEmail } from './services/email/mail-parser.js';
import { processRedNotePost } from './services/rednote/rednote-saver.js';
import { logger } from './utils/logger.js';
import {processWeiboPost} from "./services/weibo/weibo-saver.js";

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
      logger.error('Mail listener error', error);
      process.exit(1);
    });
    
    mailListener.on('mail', async (mail) => {
      logger.info('Received new email', { subject: mail.subject });
      
      // Parse email data
      const emailData = parseEmail(mail);
      
      // Process email based on its type
      if (emailData) {
        if (emailData.type === 'weibo') {
          await processWeiboPost(emailData);
        } else if (emailData.type === 'rednote') {
          await processRedNotePost(emailData);
        }
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
    logger.error('Error starting application', error);
    process.exit(1);
  }
}

  startApplication();

