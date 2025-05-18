/**
 * Weibo Saver - Main Entry Point
 * 
 * This application monitors an email inbox for Weibo share notifications,
 * downloads the shared Weibo posts, and saves them as Markdown files
 * along with any media content (images and videos).
 */
import { startApplication } from './src/index.js';

// Start the application
startApplication();