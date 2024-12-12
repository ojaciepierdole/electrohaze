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

  private readonly LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  private constructor(options: Partial<LoggerOptions> = {}) {
    this.options = {
      minLevel: 'info',
      enableConsole: true,
      maxEntries: 1000,
      ...options
    };
  }

  static getInstance(options?: Partial<LoggerOptions>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(options);
    }
    return Logger.instance;
  }

  private formatMessage(entry: LogEntry): string {
    const context = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
    return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${context}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.LOG_LEVELS[level] >= this.LOG_LEVELS[this.options.minLevel];
  }

  private addEntry(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };

    this.logs.push(entry);

    // Ogranicz liczbę przechowywanych logów
    if (this.logs.length > this.options.maxEntries) {
      this.logs = this.logs.slice(-this.options.maxEntries);
    }

    // Logowanie do konsoli
    if (this.options.enableConsole) {
      const formattedMessage = this.formatMessage(entry);
      switch (level) {
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

  debug(message: string, context?: Record<string, unknown>): void {
    this.addEntry('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.addEntry('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.addEntry('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.addEntry('error', message, context);
  }

  getLogEntries(options: {
    level?: LogLevel;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  } = {}): LogEntry[] {
    let filtered = this.logs;

    if (options.level) {
      filtered = filtered.filter(entry => entry.level === options.level);
    }

    if (options.startTime) {
      filtered = filtered.filter(entry => 
        new Date(entry.timestamp) >= options.startTime!
      );
    }

    if (options.endTime) {
      filtered = filtered.filter(entry => 
        new Date(entry.timestamp) <= options.endTime!
      );
    }

    if (options.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  clearLogs(): void {
    this.logs = [];
  }

  setMinLevel(level: LogLevel): void {
    this.options.minLevel = level;
  }

  getStats(): {
    totalEntries: number;
    entriesByLevel: Record<LogLevel, number>;
    oldestEntry?: string;
    newestEntry?: string;
  } {
    const entriesByLevel = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0
    };

    this.logs.forEach(entry => {
      entriesByLevel[entry.level]++;
    });

    return {
      totalEntries: this.logs.length,
      entriesByLevel,
      oldestEntry: this.logs[0]?.timestamp,
      newestEntry: this.logs[this.logs.length - 1]?.timestamp
    };
  }
} 