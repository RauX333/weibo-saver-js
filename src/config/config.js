/**
 * Configuration module for the Weibo Saver application
 * Loads and validates environment variables
 */
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Default configuration values
const defaultConfig = {
  imap: {
    port: 993,
    tls: true,
    connTimeout: 10000,
    authTimeout: 50000,
    autotls: 'required',
    mailbox: 'INBOX',
    searchFilter: ['UNSEEN'],
    markSeen: true,
    fetchUnreadOnStart: true,
    attachments: false,
  },
  email: {
    allowedSenders: process.env.MAIL_ALLOWED_FROM ? process.env.MAIL_ALLOWED_FROM.split(',') : [],
  },
  weibo: {
    subjectFilter: '微博分享',
    mobileUrlPrefix: 'https://m.weibo.cn/status/',
    webUrlPrefix: 'https://weibo.com/',
  },
  storage: {
    basePath: 'saved_data',
    templatePath: path.join(process.cwd(), 'weibo-template.mustache'),
  },
};

// Required environment variables
const requiredEnvVars = ['IMAP_USER', 'IMAP_PASSWORD', 'IMAP_HOST', 'MAIL_ALLOWED_FROM'];

// Validate required environment variables
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Export configuration object
export const config = {
  imap: {
    username: process.env.IMAP_USER,
    password: process.env.IMAP_PASSWORD,
    host: process.env.IMAP_HOST,
    ...defaultConfig.imap,
  },
  mail: {
    allowedFrom: process.env.MAIL_ALLOWED_FROM.split(','),
  },
  weibo: {
    ...defaultConfig.weibo,
  },
  storage: {
    ...defaultConfig.storage,
  },
};

export default config;