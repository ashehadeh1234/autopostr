/**
 * @fileoverview Error Handling Utilities
 * 
 * Provides centralized error handling, logging, and user notification system.
 * Categorizes errors and provides user-friendly error messages while maintaining
 * detailed error logs for debugging.
 * 
 * @author Social Media Manager Team
 * @version 2.0 - Simplified and focused
 */

import { toast } from "@/hooks/use-toast";
import { logger } from "./logger";

/**
 * Detailed error information structure.
 * Used internally to categorize and track errors consistently.
 */
interface ErrorDetails {
  code: string;
  message: string;
  category: 'network' | 'auth' | 'validation' | 'facebook' | 'system' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Centralized error handling system.
 * 
 * Provides methods for:
 * - Logging errors with unique IDs
 * - Categorizing errors by type and severity
 * - Showing user-friendly error messages
 * - Maintaining context for debugging
 */
class ErrorHandler {
  /**
   * Logs an error with a unique identifier and contextual information.
   * 
   * @param error - Error object or detailed error information
   * @param context - Additional context for debugging (optional)
   * @returns string - Unique error ID for tracking
   * 
   * @example
   * ```typescript
   * const errorId = errorHandler.log(new Error('Connection failed'), {
   *   userId: '123',
   *   operation: 'loadConnections'
   * });
   * ```
   */
  log(error: Error | ErrorDetails, context?: Record<string, any>): string {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    let details: ErrorDetails;
    
    if (error instanceof Error) {
      details = this.parseError(error);
    } else {
      details = error;
    }

    logger.error(`[${errorId}] ${details.category}: ${details.message}`, { 
      code: details.code, 
      severity: details.severity, 
      context 
    });

    return errorId;
  }

  /**
   * Parses a generic Error object into structured ErrorDetails.
   * 
   * Analyzes error messages to categorize errors by type and assign
   * appropriate severity levels for better error handling.
   * 
   * @param error - Generic Error object to parse
   * @returns ErrorDetails - Structured error information
   */
  private parseError(error: Error): ErrorDetails {
    const message = error.message.toLowerCase();
    
    // Facebook errors
    if (message.includes('facebook') || message.includes('fb')) {
      return {
        code: 'FB_ERROR',
        message: 'Facebook connection error',
        category: 'facebook',
        severity: 'medium'
      };
    }

    // Network errors
    if (message.includes('fetch') || message.includes('network')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        category: 'network',
        severity: 'medium'
      };
    }

    // Auth errors
    if (message.includes('unauthorized') || message.includes('auth')) {
      return {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        category: 'auth',
        severity: 'high'
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      category: 'unknown',
      severity: 'medium'
    };
  }

  /**
   * Displays a user-friendly error message via toast notification.
   * 
   * @param errorId - Unique error identifier for internal tracking
   * @param customMessage - Custom message to show (optional)
   * 
   * @example
   * ```typescript
   * errorHandler.showUserFriendlyError(errorId, 'Failed to connect to Facebook');
   * ```
   */
  showUserFriendlyError(errorId: string, customMessage?: string): void {
    const message = customMessage || "Something went wrong. Please try again.";
    toast({
      title: "Error",
      description: message,
      variant: "destructive"
    });
  }
}

/**
 * Global error handler instance.
 * 
 * Use this singleton instance throughout the application for consistent
 * error handling and logging.
 * 
 * @example
 * ```typescript
 * import { errorHandler } from '@/utils/errorHandling';
 * 
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   const errorId = errorHandler.log(error, { operation: 'riskyOperation' });
 *   errorHandler.showUserFriendlyError(errorId);
 * }
 * ```
 */
export const errorHandler = new ErrorHandler();
