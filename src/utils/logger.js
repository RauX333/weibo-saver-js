/**
 * Logger utility for the Weibo Saver application
 * Provides consistent logging throughout the application
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

// Default to INFO level unless specified in environment
const currentLogLevel = process.env.LOG_LEVEL ? 
  LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] : 
  LOG_LEVELS.INFO;

/**
 * Logger class with methods for different log levels
 */
class Logger {
  constructor(context) {
    this.context = context || 'App';
  }

  /**
   * Format a log message with timestamp and context
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} [data] - Optional data to include in the log
   * @returns {string} - Formatted log message
   */
  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    let formattedMessage = `[${timestamp}] [${level}] [${this.context}] ${message}`;
    
    if (data) {
      if (data instanceof Error) {
        formattedMessage += `\n${data.stack || data.message}`;
      } else if (typeof data === 'object') {
        try {
          formattedMessage += `\n${JSON.stringify(data, null, 2)}`;
        } catch (e) {
          formattedMessage += `\n[Object]`;
        }
      } else {
        formattedMessage += `\n${data}`;
      }
    }
    
    return formattedMessage;
  }

  /**
   * Log an error message
   * @param {string} message - Error message
   * @param {Error|Object} [error] - Optional error object
   */
  error(message, error) {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(this.formatMessage('ERROR', message, error));
    }
  }

  /**
   * Log a warning message
   * @param {string} message - Warning message
   * @param {Object} [data] - Optional data
   */
  warn(message, data) {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  /**
   * Log an info message
   * @param {string} message - Info message
   * @param {Object} [data] - Optional data
   */
  info(message, data) {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.info(this.formatMessage('INFO', message, data));
    }
  }

  /**
   * Log a debug message
   * @param {string} message - Debug message
   * @param {Object} [data] - Optional data
   */
  debug(message, data) {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message, data));
    }
  }
}

/**
 * Create a logger instance with the specified context
 * @param {string} context - Context name for the logger
 * @returns {Logger} - Logger instance
 */
export function createLogger(context) {
  return new Logger(context);
}

export default createLogger;