'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const cached = global.__mongooseConnection || {
  conn: null,
  promise: null,
  listenersRegistered: false,
};

global.__mongooseConnection = cached;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      })
      .then((conn) => conn.connection)
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  cached.conn = await cached.promise;
  logger.info(`MongoDB connected: ${cached.conn.host}`);

  return cached.conn;
};

if (!cached.listenersRegistered) {
  cached.listenersRegistered = true;

  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed (SIGINT)');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed (SIGTERM)');
    process.exit(0);
  });

  mongoose.connection.on('disconnected', () => {
    cached.conn = null;
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    cached.conn = mongoose.connection;
    logger.info('MongoDB reconnected');
  });
}

module.exports = connectDB;
