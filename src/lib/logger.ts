type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

interface LoggerOptions {
  minLevel: LogLevel;
  enableConsole: boolean;
  maxEntries: number;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private options: LoggerOptions;

  private constructor(options: Partial<LoggerOptions> = {}) {
    this.options = {
      minLevel: options.minLevel || 'info',
      enableConsole: options.enableConsole ?? true,
      maxEntries: options.maxEntries || 1000
    };
  }

  static getInstance(options?: Partial<LoggerOptions>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(options);
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.options.minLevel);
  }

  private formatMessage(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      context: entry.context ? this.sanitizeContext(entry.context) : undefined
    }, null, 2);
  }

  private sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(context)) {
      // Usuń wrażliwe dane
      if (key.toLowerCase().includes('password') || 
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('key')) {
        sanitized[key] = '[REDACTED]';
      } else if (value instanceof Error) {
        sanitized[key] = {
          name: value.name,
          message: value.message,
          stack: value.stack
        };
      } else if (value instanceof Request || value instanceof Response) {
        sanitized[key] = `[${value.constructor.name}]`;
      } else if (value instanceof FormData) {
        sanitized[key] = Object.fromEntries(value);
      } else if (value instanceof Blob || value instanceof File) {
        sanitized[key] = {
          type: value.type,
          size: value.size
        };
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private addEntry(entry: LogEntry) {
    this.logs.push(entry);
    
    // Usuń stare logi jeśli przekroczono limit
    if (this.logs.length > this.options.maxEntries) {
      this.logs = this.logs.slice(-this.options.maxEntries);
    }

    if (this.options.enableConsole) {
      const formattedMessage = this.formatMessage(entry);
      switch (entry.level) {
        case 'debug':
          console.debug(formattedMessage);
          break;
        case 'info':
          console.info(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'error':
          console.error(formattedMessage);
          break;
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (this.shouldLog('debug')) {
      this.addEntry({
        timestamp: new Date().toISOString(),
        level: 'debug',
        message,
        context
      });
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    if (this.shouldLog('info')) {
      this.addEntry({
        timestamp: new Date().toISOString(),
        level: 'info',
        message,
        context
      });
    }
  }

  warn(message: string, context?: Record<string, unknown>) {
    if (this.shouldLog('warn')) {
      this.addEntry({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message,
        context
      });
    }
  }

  error(message: string, context?: Record<string, unknown>) {
    if (this.shouldLog('error')) {
      this.addEntry({
        timestamp: new Date().toISOString(),
        level: 'error',
        message,
        context
      });
    }
  }

  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  clearLogs() {
    this.logs = [];
  }
} 