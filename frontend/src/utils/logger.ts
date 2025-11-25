/**
 * Logger Utility
 * Provides structured logging with levels that can be controlled by environment
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  enabled: boolean;
  minLevel: LogLevel;
  includeTimestamp: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const config: LogConfig = {
  enabled: import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGS === 'true',
  minLevel: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'debug',
  includeTimestamp: import.meta.env.DEV,
};

const shouldLog = (level: LogLevel): boolean => {
  if (!config.enabled) return false;
  return LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
};

const formatMessage = (level: LogLevel, message: string, ...args: any[]): any[] => {
  const levelEmojis: Record<LogLevel, string> = {
    debug: '🐛',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  };

  const emoji = levelEmojis[level];
  const timestamp = config.includeTimestamp
    ? `[${new Date().toISOString().split('T')[1].split('.')[0]}]`
    : '';

  const prefix = `${emoji} ${timestamp} ${level.toUpperCase()}:`.trim();

  return [prefix, message, ...args];
};

/**
 * Logger API
 */
export const logger = {
  /**
   * Debug level - detailed information for debugging
   */
  debug(message: string, ...args: any[]): void {
    if (shouldLog('debug')) {
      console.log(...formatMessage('debug', message, ...args));
    }
  },

  /**
   * Info level - general informational messages
   */
  info(message: string, ...args: any[]): void {
    if (shouldLog('info')) {
      console.info(...formatMessage('info', message, ...args));
    }
  },

  /**
   * Warn level - warning messages
   */
  warn(message: string, ...args: any[]): void {
    if (shouldLog('warn')) {
      console.warn(...formatMessage('warn', message, ...args));
    }
  },

  /**
   * Error level - error messages
   */
  error(message: string, ...args: any[]): void {
    if (shouldLog('error')) {
      console.error(...formatMessage('error', message, ...args));
    }
  },

  /**
   * Group related logs together
   */
  group(label: string, collapsed: boolean = false): void {
    if (config.enabled) {
      if (collapsed) {
        console.groupCollapsed(label);
      } else {
        console.group(label);
      }
    }
  },

  /**
   * End a log group
   */
  groupEnd(): void {
    if (config.enabled) {
      console.groupEnd();
    }
  },

  /**
   * Log a table (useful for arrays of objects)
   */
  table(data: any[]): void {
    if (config.enabled && shouldLog('info')) {
      console.table(data);
    }
  },

  /**
   * Measure performance
   */
  time(label: string): void {
    if (config.enabled && shouldLog('debug')) {
      console.time(label);
    }
  },

  /**
   * End performance measurement
   */
  timeEnd(label: string): void {
    if (config.enabled && shouldLog('debug')) {
      console.timeEnd(label);
    }
  },
};

/**
 * Create a namespaced logger for specific modules
 */
export const createLogger = (namespace: string) => {
  return {
    debug: (message: string, ...args: any[]) =>
      logger.debug(`[${namespace}] ${message}`, ...args),
    info: (message: string, ...args: any[]) =>
      logger.info(`[${namespace}] ${message}`, ...args),
    warn: (message: string, ...args: any[]) =>
      logger.warn(`[${namespace}] ${message}`, ...args),
    error: (message: string, ...args: any[]) =>
      logger.error(`[${namespace}] ${message}`, ...args),
  };
};

export default logger;
