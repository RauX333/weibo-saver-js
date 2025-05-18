/**
 * Error handling utilities for the Weibo Saver application
 * Provides consistent error handling throughout the application
 */
import { createLogger } from './logger.js';

const logger = createLogger('ErrorHandler');

/**
 * Custom application error class
 */
export class AppError extends Error {
  /**
   * Create a new AppError
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Error} [originalError] - Original error that caused this error
   */
  constructor(message, code, originalError) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.originalError = originalError;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error codes for the application
 */
export const ErrorCodes = {
  // Email related errors
  EMAIL_CONNECTION_ERROR: 'EMAIL_CONNECTION_ERROR',
  EMAIL_AUTHENTICATION_ERROR: 'EMAIL_AUTHENTICATION_ERROR',
  EMAIL_PARSING_ERROR: 'EMAIL_PARSING_ERROR',
  
  // Weibo related errors
  WEIBO_URL_EXTRACTION_ERROR: 'WEIBO_URL_EXTRACTION_ERROR',
  WEIBO_FETCH_ERROR: 'WEIBO_FETCH_ERROR',
  WEIBO_PARSE_ERROR: 'WEIBO_PARSE_ERROR',
  
  // Media related errors
  MEDIA_DOWNLOAD_ERROR: 'MEDIA_DOWNLOAD_ERROR',
  
  // Storage related errors
  FILE_SYSTEM_ERROR: 'FILE_SYSTEM_ERROR',
  TEMPLATE_RENDERING_ERROR: 'TEMPLATE_RENDERING_ERROR',
  
  // General errors
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
};

/**
 * Handle an error by logging it and optionally performing additional actions
 * @param {Error} error - The error to handle
 * @param {Object} [options] - Options for error handling
 * @param {boolean} [options.exit=false] - Whether to exit the process
 * @param {number} [options.exitCode=1] - Exit code to use if exiting
 * @param {Function} [options.callback] - Callback to execute after handling the error
 */
export function handleError(error, options = {}) {
  const { exit = false, exitCode = 1, callback } = options;
  
  // If it's already an AppError, log it directly
  if (error instanceof AppError) {
    logger.error(`${error.code}: ${error.message}`, error.originalError || error);
  } else {
    // Otherwise, wrap it in an AppError with UNEXPECTED_ERROR code
    logger.error(`${ErrorCodes.UNEXPECTED_ERROR}: An unexpected error occurred`, error);
  }
  
  // Execute callback if provided
  if (typeof callback === 'function') {
    try {
      callback(error);
    } catch (callbackError) {
      logger.error('Error in error handling callback', callbackError);
    }
  }
  
  // Exit if requested
  if (exit) {
    logger.info(`Exiting process with code ${exitCode}`);
    process.exit(exitCode);
  }
}

/**
 * Create an AppError with the specified code and message
 * @param {string} code - Error code from ErrorCodes
 * @param {string} message - Error message
 * @param {Error} [originalError] - Original error that caused this error
 * @returns {AppError} - New AppError instance
 */
export function createError(code, message, originalError) {
  return new AppError(message, code, originalError);
}

/**
 * Wrap an async function with error handling
 * @param {Function} fn - Async function to wrap
 * @param {Object} [options] - Error handling options
 * @returns {Function} - Wrapped function
 */
export function withErrorHandling(fn, options = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, options);
      throw error; // Re-throw to allow further handling
    }
  };
}

export default {
  AppError,
  ErrorCodes,
  handleError,
  createError,
  withErrorHandling,
};