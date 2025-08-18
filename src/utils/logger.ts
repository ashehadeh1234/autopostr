interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

interface LogEntry {
  timestamp: Date;
  level: keyof LogLevel;
  category: string;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isDevelopment = import.meta.env.DEV;
  private isDebugMode = localStorage.getItem('debug-mode') === 'true';

  constructor() {
    this.info('Logger', 'Logger initialized', { 
      isDevelopment: this.isDevelopment,
      isDebugMode: this.isDebugMode 
    });
  }

  private shouldLog(): boolean {
    return this.isDevelopment || this.isDebugMode;
  }

  private createLogEntry(
    level: keyof LogLevel, 
    category: string, 
    message: string, 
    data?: any,
    userId?: string
  ): LogEntry {
    return {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      userId,
      sessionId: sessionStorage.getItem('session-id') || undefined
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  private formatMessage(category: string, message: string): string {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    return `[${timestamp}] ${category}: ${message}`;
  }

  error(category: string, message: string, data?: any, userId?: string) {
    const entry = this.createLogEntry('ERROR', category, message, data, userId);
    this.addLog(entry);
    
    if (this.shouldLog()) {
      console.error(this.formatMessage(category, message), data);
    }
  }

  warn(category: string, message: string, data?: any, userId?: string) {
    const entry = this.createLogEntry('WARN', category, message, data, userId);
    this.addLog(entry);
    
    if (this.shouldLog()) {
      console.warn(this.formatMessage(category, message), data);
    }
  }

  info(category: string, message: string, data?: any, userId?: string) {
    const entry = this.createLogEntry('INFO', category, message, data, userId);
    this.addLog(entry);
    
    if (this.shouldLog()) {
      console.log(this.formatMessage(category, message), data);
    }
  }

  debug(category: string, message: string, data?: any, userId?: string) {
    const entry = this.createLogEntry('DEBUG', category, message, data, userId);
    this.addLog(entry);
    
    if (this.shouldLog()) {
      console.debug(this.formatMessage(category, message), data);
    }
  }

  // Navigation logging
  navigation(from: string, to: string, data?: any) {
    this.info('Navigation', `Navigating from ${from} to ${to}`, data);
  }

  // Component lifecycle logging
  componentMount(componentName: string, props?: any) {
    this.debug('Component', `${componentName} mounted`, props);
  }

  componentUnmount(componentName: string) {
    this.debug('Component', `${componentName} unmounted`);
  }

  // User action logging
  userAction(action: string, target: string, data?: any, userId?: string) {
    this.info('UserAction', `${action} on ${target}`, data, userId);
  }

  // API call logging
  apiCall(method: string, endpoint: string, data?: any, userId?: string) {
    this.info('API', `${method} ${endpoint}`, data, userId);
  }

  apiResponse(method: string, endpoint: string, status: number, data?: any, userId?: string) {
    if (status >= 400) {
      this.error('API', `${method} ${endpoint} failed (${status})`, data, userId);
    } else {
      this.debug('API', `${method} ${endpoint} success (${status})`, data, userId);
    }
  }

  // Connection logging
  connectionStart(platform: string, userId?: string) {
    this.info('Connection', `Starting ${platform} connection`, undefined, userId);
  }

  connectionSuccess(platform: string, data?: any, userId?: string) {
    this.info('Connection', `${platform} connection successful`, data, userId);
  }

  connectionError(platform: string, error: any, userId?: string) {
    this.error('Connection', `${platform} connection failed`, error, userId);
  }

  // Get logs for display
  getLogs(level?: keyof LogLevel, category?: string, limit = 100): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }
    
    return filteredLogs.slice(0, limit);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    this.info('Logger', 'Logs cleared');
  }

  // Export logs
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Toggle debug mode
  toggleDebugMode() {
    this.isDebugMode = !this.isDebugMode;
    localStorage.setItem('debug-mode', this.isDebugMode.toString());
    this.info('Logger', `Debug mode ${this.isDebugMode ? 'enabled' : 'disabled'}`);
  }

  // Get debug mode status
  getDebugMode(): boolean {
    return this.isDebugMode;
  }
}

export const logger = new Logger();