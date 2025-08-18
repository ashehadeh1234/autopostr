import { toast } from "@/hooks/use-toast";

export interface ErrorDetails {
  code: string;
  message: string;
  category: 'network' | 'api' | 'auth' | 'validation' | 'facebook' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  userMessage?: string;
  actionable?: boolean;
  retryable?: boolean;
}

export interface ErrorLog {
  id: string;
  timestamp: number;
  error: ErrorDetails;
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
}

class ErrorHandler {
  private sessionId: string;
  private errorLogs: ErrorLog[] = [];
  private maxLogs = 100;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  log(error: Error | ErrorDetails, context?: Record<string, any>, userId?: string): string {
    const errorId = this.generateErrorId();
    
    let errorDetails: ErrorDetails;
    
    if (error instanceof Error) {
      errorDetails = this.parseError(error, context);
    } else {
      errorDetails = error;
    }

    const errorLog: ErrorLog = {
      id: errorId,
      timestamp: Date.now(),
      error: errorDetails,
      userId,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.errorLogs.push(errorLog);
    
    // Keep only the last N logs
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs = this.errorLogs.slice(-this.maxLogs);
    }

    // Log to console with structured format
    console.group(`🚨 Error [${errorDetails.category}:${errorDetails.severity}] - ${errorId}`);
    console.error('Message:', errorDetails.message);
    console.error('Code:', errorDetails.code);
    if (context) console.error('Context:', context);
    console.error('Full Error:', errorLog);
    console.groupEnd();

    return errorId;
  }

  private parseError(error: Error, context?: Record<string, any>): ErrorDetails {
    const message = error.message.toLowerCase();
    
    // Facebook API specific errors
    if (message.includes('facebook') || message.includes('oauth')) {
      return this.categorizeFacebookError(error, context);
    }
    
    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
      return {
        code: 'NETWORK_ERROR',
        message: error.message,
        category: 'network',
        severity: 'medium',
        context,
        userMessage: 'Network connection issue. Please check your internet connection.',
        retryable: true
      };
    }
    
    // Auth errors
    if (message.includes('unauthorized') || message.includes('token') || message.includes('auth')) {
      return {
        code: 'AUTH_ERROR',
        message: error.message,
        category: 'auth',
        severity: 'high',
        context,
        userMessage: 'Authentication error. Please try logging in again.',
        actionable: true
      };
    }
    
    // Validation errors
    if (message.includes('invalid') || message.includes('required') || message.includes('validation')) {
      return {
        code: 'VALIDATION_ERROR',
        message: error.message,
        category: 'validation',
        severity: 'low',
        context,
        userMessage: 'Please check your input and try again.',
        actionable: true
      };
    }
    
    // Default unknown error
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      category: 'unknown',
      severity: 'medium',
      context,
      userMessage: 'An unexpected error occurred. Please try again.'
    };
  }

  private categorizeFacebookError(error: Error, context?: Record<string, any>): ErrorDetails {
    const message = error.message.toLowerCase();
    
    if (message.includes('app id') || message.includes('credentials')) {
      return {
        code: 'FB_CONFIG_ERROR',
        message: error.message,
        category: 'facebook',
        severity: 'critical',
        context,
        userMessage: 'Facebook app configuration error. Please contact support.',
        actionable: false
      };
    }
    
    if (message.includes('permissions') || message.includes('scope')) {
      return {
        code: 'FB_PERMISSIONS_ERROR',
        message: error.message,
        category: 'facebook',
        severity: 'medium',
        context,
        userMessage: 'Facebook permissions error. Please try reconnecting your account.',
        actionable: true,
        retryable: true
      };
    }
    
    if (message.includes('token') && message.includes('expired')) {
      return {
        code: 'FB_TOKEN_EXPIRED',
        message: error.message,
        category: 'facebook',
        severity: 'medium',
        context,
        userMessage: 'Facebook connection expired. Please reconnect your account.',
        actionable: true,
        retryable: true
      };
    }
    
    if (message.includes('rate limit') || message.includes('quota')) {
      return {
        code: 'FB_RATE_LIMIT',
        message: error.message,
        category: 'facebook',
        severity: 'medium',
        context,
        userMessage: 'Facebook rate limit reached. Please try again later.',
        retryable: true
      };
    }
    
    return {
      code: 'FB_API_ERROR',
      message: error.message,
      category: 'facebook',
      severity: 'high',
      context,
      userMessage: 'Facebook API error. Please try again or contact support if the issue persists.',
      retryable: true
    };
  }

  showUserFriendlyError(errorId: string, customMessage?: string): void {
    const errorLog = this.errorLogs.find(log => log.id === errorId);
    if (!errorLog) return;

    const { error } = errorLog;
    const userMessage = customMessage || error.userMessage || error.message;
    
    toast({
      title: this.getErrorTitle(error),
      description: `${userMessage} (Error ID: ${errorId.slice(-8)})`,
      variant: error.severity === 'critical' || error.severity === 'high' ? 'destructive' : 'default',
    });
  }

  private getErrorTitle(error: ErrorDetails): string {
    switch (error.category) {
      case 'facebook':
        return 'Facebook Connection Issue';
      case 'network':
        return 'Connection Error';
      case 'auth':
        return 'Authentication Error';
      case 'validation':
        return 'Validation Error';
      case 'api':
        return 'API Error';
      default:
        return 'Error';
    }
  }

  getRecentErrors(limit = 10): ErrorLog[] {
    return this.errorLogs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getErrorsByCategory(category: ErrorDetails['category']): ErrorLog[] {
    return this.errorLogs.filter(log => log.error.category === category);
  }

  exportErrorLogs(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      exportTime: new Date().toISOString(),
      errorLogs: this.errorLogs
    }, null, 2);
  }

  clearLogs(): void {
    this.errorLogs = [];
  }
}

export const errorHandler = new ErrorHandler();
