/**
 * Logger Utility
 * Centralized logging for the application
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
}

class Logger {
  private static logs: LogEntry[] = [];
  private static maxLogs = 1000;
  private static isDevelopment = import.meta.env.DEV;

  /**
   * Log a debug message
   */
  static debug(context: string, message: string, data?: any): void {
    Logger.log('debug', context, message, data);
  }

  /**
   * Log an info message
   */
  static info(context: string, message: string, data?: any): void {
    Logger.log('info', context, message, data);
  }

  /**
   * Log a warning message
   */
  static warn(context: string, message: string, data?: any): void {
    Logger.log('warn', context, message, data);
  }

  /**
   * Log an error message
   */
  static error(context: string, message: string, error?: any): void {
    const data = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    Logger.log('error', context, message, data);
  }

  /**
   * Internal log method
   */
  private static log(level: LogLevel, context: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const entry: LogEntry = {
      timestamp,
      level,
      context,
      message,
      data,
    };

    // Store in memory
    Logger.logs.push(entry);
    if (Logger.logs.length > Logger.maxLogs) {
      Logger.logs.shift();
    }

    // Console output in development
    if (Logger.isDevelopment) {
      const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;
      const logData = data ? ` ${JSON.stringify(data)}` : '';

      switch (level) {
        case 'debug':
          console.debug(prefix, message, logData);
          break;
        case 'info':
          console.info(prefix, message, logData);
          break;
        case 'warn':
          console.warn(prefix, message, logData);
          break;
        case 'error':
          console.error(prefix, message, logData);
          break;
      }
    }
  }

  /**
   * Get all logs
   */
  static getLogs(): LogEntry[] {
    return [...Logger.logs];
  }

  /**
   * Get logs by level
   */
  static getLogsByLevel(level: LogLevel): LogEntry[] {
    return Logger.logs.filter(log => log.level === level);
  }

  /**
   * Get logs by context
   */
  static getLogsByContext(context: string): LogEntry[] {
    return Logger.logs.filter(log => log.context === context);
  }

  /**
   * Clear all logs
   */
  static clearLogs(): void {
    Logger.logs = [];
  }

  /**
   * Export logs as JSON
   */
  static exportLogs(): string {
    return JSON.stringify(Logger.logs, null, 2);
  }

  /**
   * Export logs as CSV
   */
  static exportLogsAsCSV(): string {
    const headers = ['Timestamp', 'Level', 'Context', 'Message', 'Data'];
    const rows = Logger.logs.map(log => [
      log.timestamp,
      log.level,
      log.context,
      log.message,
      JSON.stringify(log.data || ''),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    return csv;
  }
}

export { Logger };
