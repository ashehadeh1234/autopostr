import { toast } from "@/hooks/use-toast";
import { logger } from "./logger";

interface ErrorDetails {
  code: string;
  message: string;
  category: 'network' | 'auth' | 'validation' | 'facebook' | 'system' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorHandler {
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

  showUserFriendlyError(errorId: string, customMessage?: string): void {
    const message = customMessage || "Something went wrong. Please try again.";
    toast({
      title: "Error",
      description: message,
      variant: "destructive"
    });
  }
}

export const errorHandler = new ErrorHandler();
