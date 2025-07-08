/**
 * Comprehensive Logging System for NutriFlow
 * Provides structured logging with multiple levels and destinations
 */

import config from './config'

// Log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// Log categories for better organization
export enum LogCategory {
  AUTH = 'auth',
  DATABASE = 'database',
  API = 'api',
  BUSINESS = 'business',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  INTEGRATION = 'integration',
  USER_ACTION = 'user_action',
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  userId?: string
  sessionId?: string
  requestId?: string
  metadata?: Record<string, any>
  error?: Error
  duration?: number
}

interface LoggerConfig {
  minLevel: LogLevel
  enableConsole: boolean
  enableFile: boolean
  enableRemote: boolean
  remoteEndpoint?: string
  apiKey?: string
}

class Logger {
  private config: LoggerConfig
  private logBuffer: LogEntry[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor(config: LoggerConfig) {
    this.config = config
    
    // Flush logs periodically in production
    if (config.enableRemote && typeof window === 'undefined') {
      this.flushInterval = setInterval(() => {
        this.flushLogs()
      }, 5000) // Flush every 5 seconds
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.minLevel
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp
    const levelStr = LogLevel[entry.level].padEnd(5)
    const category = `[${entry.category}]`.padEnd(12)
    const prefix = `${timestamp} ${levelStr} ${category}`
    
    let message = `${prefix} ${entry.message}`
    
    if (entry.userId) {
      message += ` (user: ${entry.userId})`
    }
    
    if (entry.duration !== undefined) {
      message += ` (${entry.duration}ms)`
    }
    
    return message
  }

  private async writeToConsole(entry: LogEntry): Promise<void> {
    const message = this.formatMessage(entry)
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(message, entry.error || entry.metadata)
        break
      case LogLevel.WARN:
        console.warn(message, entry.metadata)
        break
      case LogLevel.INFO:
        console.info(message, entry.metadata)
        break
      case LogLevel.DEBUG:
        console.debug(message, entry.metadata)
        break
    }
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    if (typeof window !== 'undefined') return // File writing only on server

    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const logDir = path.join(process.cwd(), 'logs')
      await fs.mkdir(logDir, { recursive: true })
      
      const logFile = path.join(logDir, `${entry.category}-${new Date().toISOString().split('T')[0]}.log`)
      const logLine = JSON.stringify(entry) + '\n'
      
      await fs.appendFile(logFile, logLine)
    } catch (error) {
      console.error('Failed to write log to file:', error)
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(entry)
      })
    } catch (error) {
      // Fallback to console if remote logging fails
      console.error('Failed to send log to remote endpoint:', error)
    }
  }

  private async writeLog(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) return

    const promises: Promise<void>[] = []

    if (this.config.enableConsole) {
      promises.push(this.writeToConsole(entry))
    }

    if (this.config.enableFile && typeof window === 'undefined') {
      promises.push(this.writeToFile(entry))
    }

    if (this.config.enableRemote) {
      // Buffer logs for batch sending
      this.logBuffer.push(entry)
    }

    await Promise.allSettled(promises)
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return

    const logsToSend = [...this.logBuffer]
    this.logBuffer = []

    try {
      if (this.config.remoteEndpoint) {
        await fetch(this.config.remoteEndpoint + '/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify({ logs: logsToSend })
        })
      }
    } catch (error) {
      // Re-add failed logs to buffer
      this.logBuffer.unshift(...logsToSend)
      console.error('Failed to flush logs:', error)
    }
  }

  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as any : undefined,
    }
  }

  // Public logging methods
  error(category: LogCategory, message: string, error?: Error, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, category, message, metadata, error)
    this.writeLog(entry)
  }

  warn(category: LogCategory, message: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.WARN, category, message, metadata)
    this.writeLog(entry)
  }

  info(category: LogCategory, message: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.INFO, category, message, metadata)
    this.writeLog(entry)
  }

  debug(category: LogCategory, message: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, category, message, metadata)
    this.writeLog(entry)
  }

  // Specialized logging methods
  logApiRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    const entry = this.createLogEntry(
      statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO,
      LogCategory.API,
      `${method} ${path} - ${statusCode}`,
      { ...metadata, method, path, statusCode, userId }
    )
    entry.duration = duration
    entry.userId = userId
    this.writeLog(entry)
  }

  logUserAction(
    action: string,
    userId: string,
    resource?: string,
    metadata?: Record<string, any>
  ): void {
    const entry = this.createLogEntry(
      LogLevel.INFO,
      LogCategory.USER_ACTION,
      `User ${action}${resource ? ` ${resource}` : ''}`,
      { ...metadata, action, resource }
    )
    entry.userId = userId
    this.writeLog(entry)
  }

  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>
  ): void {
    const level = severity === 'critical' || severity === 'high' ? LogLevel.ERROR : 
                  severity === 'medium' ? LogLevel.WARN : LogLevel.INFO
    
    const entry = this.createLogEntry(
      level,
      LogCategory.SECURITY,
      `Security event: ${event}`,
      { ...details, severity }
    )
    this.writeLog(entry)
  }

  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    error?: Error
  ): void {
    const entry = this.createLogEntry(
      success ? LogLevel.DEBUG : LogLevel.ERROR,
      LogCategory.DATABASE,
      `${operation} on ${table} ${success ? 'completed' : 'failed'}`,
      { operation, table, success },
      error
    )
    entry.duration = duration
    this.writeLog(entry)
  }

  logPerformanceMetric(
    metric: string,
    value: number,
    unit: string,
    metadata?: Record<string, any>
  ): void {
    const entry = this.createLogEntry(
      LogLevel.INFO,
      LogCategory.PERFORMANCE,
      `Performance metric: ${metric} = ${value}${unit}`,
      { ...metadata, metric, value, unit }
    )
    this.writeLog(entry)
  }

  // Create context-aware logger
  createContextLogger(context: {
    userId?: string
    sessionId?: string
    requestId?: string
  }): ContextLogger {
    return new ContextLogger(this, context)
  }

  // Cleanup method
  async destroy(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    await this.flushLogs()
  }
}

class ContextLogger {
  constructor(
    private logger: Logger,
    private context: {
      userId?: string
      sessionId?: string
      requestId?: string
    }
  ) {}

  private addContext(metadata?: Record<string, any>): Record<string, any> {
    return {
      ...metadata,
      ...this.context
    }
  }

  error(category: LogCategory, message: string, error?: Error, metadata?: Record<string, any>): void {
    this.logger.error(category, message, error, this.addContext(metadata))
  }

  warn(category: LogCategory, message: string, metadata?: Record<string, any>): void {
    this.logger.warn(category, message, this.addContext(metadata))
  }

  info(category: LogCategory, message: string, metadata?: Record<string, any>): void {
    this.logger.info(category, message, this.addContext(metadata))
  }

  debug(category: LogCategory, message: string, metadata?: Record<string, any>): void {
    this.logger.debug(category, message, this.addContext(metadata))
  }
}

// Create logger instance based on environment
const loggerConfig: LoggerConfig = {
  minLevel: config.app.isDev ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableFile: config.app.isProd,
  enableRemote: config.app.isProd && config.monitoring.enabled,
  remoteEndpoint: config.monitoring.sentryDsn ? 'https://api.sentry.io/logs' : undefined,
  apiKey: process.env.LOGGING_API_KEY,
}

export const logger = new Logger(loggerConfig)

// Express middleware for request logging
export const requestLoggingMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now()
  const requestId = Math.random().toString(36).substr(2, 9)
  
  req.requestId = requestId
  req.logger = logger.createContextLogger({
    requestId,
    userId: req.user?.id
  })

  res.on('finish', () => {
    const duration = Date.now() - start
    logger.logApiRequest(
      req.method,
      req.path,
      res.statusCode,
      duration,
      req.user?.id,
      {
        requestId,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      }
    )
  })

  next()
}

// React hook for client-side logging
export const useLogger = () => {
  return {
    error: (message: string, error?: Error, metadata?: Record<string, any>) => {
      logger.error(LogCategory.BUSINESS, message, error, metadata)
    },
    warn: (message: string, metadata?: Record<string, any>) => {
      logger.warn(LogCategory.BUSINESS, message, metadata)
    },
    info: (message: string, metadata?: Record<string, any>) => {
      logger.info(LogCategory.BUSINESS, message, metadata)
    },
    logUserAction: (action: string, resource?: string, metadata?: Record<string, any>) => {
      logger.logUserAction(action, 'client-user', resource, metadata)
    }
  }
}

// Utility functions
export const withLogging = <T extends (...args: any[]) => any>(
  fn: T,
  category: LogCategory,
  name: string
): T => {
  return ((...args: any[]) => {
    const start = Date.now()
    
    try {
      const result = fn(...args)
      
      if (result instanceof Promise) {
        return result
          .then((value) => {
            const duration = Date.now() - start
            logger.debug(category, `${name} completed`, { duration })
            return value
          })
          .catch((error) => {
            const duration = Date.now() - start
            logger.error(category, `${name} failed`, error, { duration })
            throw error
          })
      } else {
        const duration = Date.now() - start
        logger.debug(category, `${name} completed`, { duration })
        return result
      }
    } catch (error) {
      const duration = Date.now() - start
      logger.error(category, `${name} failed`, error as Error, { duration })
      throw error
    }
  }) as T
}

export default logger
