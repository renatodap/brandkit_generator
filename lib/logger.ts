/**
 * Production-Level Structured Logger
 *
 * Replaces console.log with proper structured logging.
 * In production, this can be integrated with services like Sentry, LogRocket, etc.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private env: string;

  constructor() {
    this.env = process.env.NODE_ENV || 'development';
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      env: this.env,
      ...context,
    };

    // In production, send to logging service (Sentry, LogRocket, etc.)
    // For now, use console with structured format
    if (this.env === 'production') {
      // Only log warnings and errors in production
      if (level === 'error') {
        // eslint-disable-next-line no-console
        console.error(JSON.stringify(logEntry));
      } else if (level === 'warn') {
        // eslint-disable-next-line no-console
        console.warn(JSON.stringify(logEntry));
      }
    } else {
      // Development: Pretty print
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      };

      // eslint-disable-next-line no-console
      console.log(`${emoji[level]} [${level.toUpperCase()}] ${message}`, context || '');
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };

    this.log('error', message, errorContext);
  }
}

// Export singleton instance
export const logger = new Logger();
