import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const isDevelopment = process.env.NODE_ENV === 'development';
const logDir = isDevelopment
  ? path.join(__dirname, '../../logs')
  : path.join(app.getPath('userData'), 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'app.log');

export const logLevels = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
} as const;

type LogLevel = typeof logLevels[keyof typeof logLevels];

function formatMessage(level: LogLevel, message: string, meta?: unknown): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${level}: ${message}${metaStr}\n`;
}

function writeToFile(message: string) {
  fs.appendFileSync(logFile, message);
}

function consoleLog(level: LogLevel, message: string, meta?: unknown) {
  const formattedMessage = formatMessage(level, message, meta);
  if (isDevelopment) {
    console.log(formattedMessage);
  }
  writeToFile(formattedMessage);
}

export function logDebug(message: string, meta?: unknown) {
  consoleLog(logLevels.DEBUG, message, meta);
}

export function logInfo(message: string, meta?: unknown) {
  consoleLog(logLevels.INFO, message, meta);
}

export function logWarn(message: string, meta?: unknown) {
  consoleLog(logLevels.WARN, message, meta);
}

export function logError(message: string, meta?: unknown) {
  consoleLog(logLevels.ERROR, message, meta);
}

export function clearLogs() {
  fs.writeFileSync(logFile, '');
}

export function getLogs(): string {
  try {
    return fs.readFileSync(logFile, 'utf-8');
  } catch (error) {
    return '';
  }
}

export const logApiRequest = (request: any) => {
  logDebug(`API Request: ${request.method} ${request.url}`);
  if (request.data) {
    logDebug(`Request Data: ${JSON.stringify(request.data)}`);
  }
};

export const logApiError = (error: any) => {
  logError(`API Error: ${error.message}`);
  if (error.response) {
    logError(`Response Data: ${JSON.stringify(error.response.data)}`);
  }
};

export default {
  debug: logDebug,
  info: logInfo,
  warn: logWarn,
  error: logError,
  clear: clearLogs,
  getLogs,
}; 