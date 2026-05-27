'use strict';

require('dotenv').config();

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const morgan       = require('morgan');
const compression  = require('compression');
const mongoSanitize = require('express-mongo-sanitize');

const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter }             = require('./middleware/rateLimiter');
const { initFirebase }           = require('./config/firebase');
const logger                     = require('./utils/logger');

// ── Initialise Firebase Admin SDK ─────────────────────────────────────────────
initFirebase();

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
// Using origin:true mirrors the request Origin back, which is required when
// credentials:true is set — browsers reject the combination of credentials
// + wildcard '*' origin.
const rawOrigins = process.env.ALLOWED_ORIGINS ?? '*';
const corsOrigin = rawOrigins === '*'
  ? true                                            // mirrors request Origin
  : rawOrigins.split(',').map((o) => o.trim());

app.use(
  cors({
    origin:         corsOrigin,
    credentials:    true,
    methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Sanitise query/body against NoSQL injection ───────────────────────────────
app.use(mongoSanitize());

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── HTTP request logger ───────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
    })
  );
}

// ── Global rate limiter ───────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) =>
  res.json({
    success: true,
    message: 'AI Planner Backend API',
    health:  '/health',
    api:     '/api',
  })
);

app.get(['/favicon.ico', '/favicon.png'], (req, res) => res.status(204).end());

app.get('/health', (req, res) =>
  res.json({
    success: true,
    status:  'ok',
    version: process.env.npm_package_version || '1.0.0',
    uptime:  process.uptime(),
    env:     process.env.NODE_ENV,
  })
);

// ── API Routes ────────────────────────────────────────────────────────────────
app.get('/api', (req, res) =>
  res.json({
    success: true,
    message: 'API is running',
    endpoints: [
      '/api/auth',
      '/api/users',
      '/api/meals',
      '/api/diets',
      '/api/foods',
      '/api/water',
      '/api/exercises',
      '/api/workouts',
      '/api/reminders',
    ],
  })
);

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/meals',     require('./routes/meals'));
app.use('/api/diets',     require('./routes/diets'));
app.use('/api/foods',     require('./routes/foods'));
app.use('/api/water',     require('./routes/water'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/workouts',  require('./routes/workouts'));
app.use('/api/reminders', require('./routes/reminders'));

// ── 404 + Global error handler ────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
