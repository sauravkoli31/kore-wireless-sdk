/**
 * Log levels
 * @internal
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/**
 * Logger configuration
 * @internal
 */
export interface LoggerConfig {
  level: LogLevel;
  maskFields?: string[];
}

/**
 * Logger utility for safe logging
 * @internal
 */
export class Logger {
  private static config: LoggerConfig = {
    level: LogLevel.INFO,
    maskFields: [
      'Authorization',
      'X-Signature',
      'client_secret',
      'access_token',
      'password',
      'secret'
    ]
  };

  /**
   * Configure the logger
   */
  static configure(config: Partial<LoggerConfig>): void {
    Logger.config = { ...Logger.config, ...config };
  }

  /**
   * Mask sensitive data in objects
   */
  private static maskSensitiveData(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => Logger.maskSensitiveData(item));
    }

    const masked: Record<string, unknown> = {};
    Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
      if (Logger.config.maskFields?.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      )) {
        masked[key] = '***MASKED***';
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = Logger.maskSensitiveData(value);
      } else {
        masked[key] = value;
      }
    });

    return masked;
  }

  /**
   * Log a debug message
   */
  static debug(message: string, ...args: unknown[]): void {
    if (Logger.shouldLog(LogLevel.DEBUG)) {
      console.debug(
        `[DEBUG] ${message}`,
        ...args.map(arg => Logger.maskSensitiveData(arg))
      );
    }
  }

  /**
   * Log an info message
   */
  static info(message: string, ...args: unknown[]): void {
    if (Logger.shouldLog(LogLevel.INFO)) {
      console.info(
        `[INFO] ${message}`,
        ...args.map(arg => Logger.maskSensitiveData(arg))
      );
    }
  }

  /**
   * Log a warning message
   */
  static warn(message: string, ...args: unknown[]): void {
    if (Logger.shouldLog(LogLevel.WARN)) {
      console.warn(
        `[WARN] ${message}`,
        ...args.map(arg => Logger.maskSensitiveData(arg))
      );
    }
  }

  /**
   * Log an error message
   */
  static error(message: string, error?: Error, ...args: unknown[]): void {
    if (Logger.shouldLog(LogLevel.ERROR)) {
      console.error(
        `[ERROR] ${message}`,
        error?.message || '',
        ...args.map(arg => Logger.maskSensitiveData(arg))
      );
    }
  }

  private static shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const configIndex = levels.indexOf(Logger.config.level);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= configIndex;
  }
} 