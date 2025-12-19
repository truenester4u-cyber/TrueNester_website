/**
 * Centralized Logger with Request ID Tracking
 * 
 * WHY: Provides consistent logging across all services with request correlation.
 * Every log entry includes a request_id for tracing requests through the system.
 * Supports structured logging for production monitoring (e.g., Datadog, Logtail).
 */

import { randomUUID } from "node:crypto";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  conversationId?: string;
  customerId?: string;
  channel?: string;
  eventType?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private static instance: Logger;
  private minLevel: LogLevel;
  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private constructor() {
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || "info";
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.minLevel];
  }

  private formatEntry(entry: LogEntry): string {
    const isProduction = process.env.NODE_ENV === "production";
    
    if (isProduction) {
      // JSON format for production (structured logging)
      return JSON.stringify(entry);
    }
    
    // Human-readable format for development
    const { timestamp, level, message, context, error } = entry;
    const contextStr = Object.keys(context).length > 0 
      ? ` ${JSON.stringify(context)}` 
      : "";
    const errorStr = error ? `\n  Error: ${error.message}\n  Stack: ${error.stack}` : "";
    
    const levelColors: Record<LogLevel, string> = {
      debug: "\x1b[36m", // cyan
      info: "\x1b[32m",  // green
      warn: "\x1b[33m",  // yellow
      error: "\x1b[31m", // red
    };
    const reset = "\x1b[0m";
    
    return `${timestamp} ${levelColors[level]}[${level.toUpperCase()}]${reset} ${message}${contextStr}${errorStr}`;
  }

  private log(level: LogLevel, message: string, context: LogContext = {}, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        requestId: context.requestId || "no-request-id",
      },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const formatted = this.formatEntry(entry);
    
    switch (level) {
      case "error":
        console.error(formatted);
        break;
      case "warn":
        console.warn(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log("error", message, context, error);
  }

  // Create a child logger with preset context
  child(baseContext: LogContext): ChildLogger {
    return new ChildLogger(this, baseContext);
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private baseContext: LogContext
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.baseContext, ...context };
  }

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, this.mergeContext(context));
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.parent.error(message, error, this.mergeContext(context));
  }
}

export const logger = Logger.getInstance();

// Generate a new request ID
export const generateRequestId = (): string => randomUUID();

// Express middleware to attach request ID
export const requestIdMiddleware = (req: any, res: any, next: any): void => {
  const requestId = req.headers["x-request-id"] || generateRequestId();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
};
