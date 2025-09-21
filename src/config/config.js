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
  weibo: {
    subjectFilter: '微博分享',
    mobileUrlPrefix: 'https://m.weibo.cn/status/',
    webUrlPrefix: 'https://weibo.com/',
    templatePath:path.join(process.cwd(),'src/templates/weibo-template.mustache'),
  },
  rednote:{
    subjectFilter: '小红书',
    templatePath:path.join(process.cwd(), 'src/templates/rednote-template.mustache'),
  },
  storage: {
    basePath: 'saved_data',
  },
  logLevel: 'INFO', // Default log level
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
  logLevel: process.env.LOG_LEVEL ? process.env.LOG_LEVEL.toUpperCase() : defaultConfig.logLevel,
  imap: {
    username: process.env.IMAP_USER,
    password: process.env.IMAP_PASSWORD,
    host: process.env.IMAP_HOST,
    ...defaultConfig.imap,
  },
  mail: {
    allowedFrom: process.env.MAIL_ALLOWED_FROM ? process.env.MAIL_ALLOWED_FROM.split(',') : [],
  },
  weibo: {
    ...defaultConfig.weibo,
  },
  rednote: {
    ...defaultConfig.rednote,
  },
  storage: {
    ...defaultConfig.storage,
  },
};

export default config;