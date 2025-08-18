/**
 * @fileoverview Logging Utilities
 * 
 * Provides a simple, consistent logging interface for the application.
 * Automatically handles development vs production environments and
 * adds timestamps to all log entries.
 * 
 * @author Social Media Manager Team
 * @version 2.0 - Simplified and focused
 */

/**
 * Available log levels in order of severity.
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Simple logging class with environment-aware behavior.
 * 
 * Features:
 * - Automatic timestamp addition
 * - Development vs production filtering
 * - Consistent log formatting
 * - Multiple log levels
 */
class Logger {
  private isDevelopment = import.meta.env.DEV;

  /**
   * Internal logging method that handles formatting and filtering.
   * 
   * @param level - Log level (debug, info, warn, error)
   * @param message - Log message
   * @param data - Additional data to log (optional)
   */
  private log(level: LogLevel, message: string, data?: any) {
    if (!this.isDevelopment && level === 'debug') return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (data) {
      console[level](prefix, message, data);
    } else {
      console[level](prefix, message);
    }
  }

  /**
   * Logs debug information (development only).
   * 
   * @param message - Debug message
   * @param data - Additional debug data
   */
  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  /**
   * Logs informational messages.
   * 
   * @param message - Information message
   * @param data - Additional context data
   */
  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  /**
   * Logs warning messages.
   * 
   * @param message - Warning message
   * @param data - Additional warning context
   */
  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  /**
   * Logs error messages.
   * 
   * @param message - Error message
   * @param data - Additional error context
   */
  error(message: string, data?: any) {
    this.log('error', message, data);
  }
}

/**
 * Global logger instance.
 * 
 * Use this singleton instance throughout the application for consistent
 * logging behavior.
 * 
 * @example
 * ```typescript
 * import { logger } from '@/utils/logger';
 * 
 * logger.info('User connected to Facebook', { userId: '123' });
 * logger.error('Connection failed', { error: error.message });
 * ```
 */
export const logger = new Logger();