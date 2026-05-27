'use strict';

const path = require('path');
const winston = require('winston');

const { combine, timestamp, printf, colorize, errors } = winston.format;
const enableFileLogs = process.env.ENABLE_FILE_LOGS === 'true' && !process.env.VERCEL;
const logDir = process.env.LOG_DIR || 'logs';

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) =>
    stack
      ? `${ts} [${level}]: ${message}\n${stack}`
      : `${ts} [${level}]: ${message}`
  )
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json()
);

const transports = [new winston.transports.Console()];

if (enableFileLogs) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
    })
  );
}

const logger = winston.createLogger({
  level:  process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports,
  exitOnError: false,
});

module.exports = logger;
