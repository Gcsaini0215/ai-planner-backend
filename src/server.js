'use strict';

require('dotenv').config();

const app       = require('./app');
const connectDB = require('./config/database');
const logger    = require('./utils/logger');

const PORT = parseInt(process.env.PORT, 10) || 5002;

const startServer = async () => {
  try {
    // Connect to MongoDB first, then start HTTP server
    await connectDB();

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
      logger.info(`📡 API base: http://localhost:${PORT}/api`);
      logger.info(`❤️  Health:   http://localhost:${PORT}/health`);
    });

    // ── Graceful shutdown ──────────────────────────────────────────────────
    const shutdown = (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    // ── Unhandled promise rejections ───────────────────────────────────────
    process.on('unhandledRejection', (reason) => {
      logger.error(`Unhandled Rejection: ${reason}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
