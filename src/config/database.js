'use strict';

const prisma = require('./prisma');
const logger = require('../utils/logger');

/**
 * Verify the Prisma/PostgreSQL connection.
 * Called once on startup; throws if the DB is unreachable.
 */
const connectDB = async () => {
  await prisma.$connect();
  logger.info('PostgreSQL connected via Prisma');
};

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  logger.info('PostgreSQL disconnected (SIGINT)');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  logger.info('PostgreSQL disconnected (SIGTERM)');
  process.exit(0);
});

module.exports = connectDB;
