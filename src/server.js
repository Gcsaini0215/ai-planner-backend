'use strict';

require('dotenv').config();

const http       = require('http');
const { Server } = require('socket.io');
const app        = require('./app');
const connectDB  = require('./config/database');
const prisma     = require('./config/prisma');
const logger     = require('./utils/logger');
const { verifyAccessToken } = require('./utils/jwt');

const PORT = parseInt(process.env.PORT, 10) || 5002;

// ── Track online users: Map<userId, Set<socketId>> ───────────────────────────
const onlineUsers = new Map();

const addOnlineUser    = (userId, socketId) => {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
};
const removeOnlineUser = (userId, socketId) => {
  const sockets = onlineUsers.get(userId);
  if (sockets) { sockets.delete(socketId); if (sockets.size === 0) onlineUsers.delete(userId); }
};
const isOnline         = (userId) => onlineUsers.has(userId.toString());

// ─────────────────────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed food database
    try {
      const seedFoods = require('./seed/seedFoods');
      const count = await prisma.food.count({ where: { isVerified: true } });
      if (count < 60) {
        await seedFoods();
        logger.info('✅ Food database seeded');
      } else {
        logger.info(`ℹ️  Food DB has ${count} verified foods — seed skipped`);
      }
    } catch (e) {
      logger.warn(`Food seed skipped: ${e.message}`);
    }

    const server = http.createServer(app);

    // ── Socket.IO ─────────────────────────────────────────────────────────────
    const io = new Server(server, {
      cors: { origin: process.env.ALLOWED_ORIGINS ?? '*', credentials: true },
      pingTimeout:  60000,
      pingInterval: 25000,
    });

    // Auth middleware
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token
          || socket.handshake.headers?.authorization?.replace('Bearer ', '');
        if (!token) return next(new Error('Unauthorised'));
        const payload = verifyAccessToken(token);
        socket.userId = payload.id;
        next();
      } catch {
        next(new Error('Auth error'));
      }
    });

    io.on('connection', (socket) => {
      const userId = socket.userId;
      logger.info(`Socket connected: ${userId}`);
      addOnlineUser(userId, socket.id);
      socket.broadcast.emit('user:online', { userId });
      socket.join(`user:${userId}`);

      // Join a chat room
      socket.on('chat:join', async ({ chatId }) => {
        try {
          const chat = await prisma.chat.findFirst({
            where: { id: chatId, participants: { has: userId } },
          });
          if (chat) socket.join(`chat:${chatId}`);
        } catch (e) { logger.error(e.message); }
      });

      // Send message
      socket.on('message:send', async (data) => {
        try {
          const { chatId, text, type = 'text', mediaUrl = '', planId } = data;

          const chat = await prisma.chat.findFirst({
            where: { id: chatId, participants: { has: userId } },
          });
          if (!chat) return socket.emit('error', { message: 'Access denied' });

          const msg = await prisma.message.create({
            data: { chatId, senderId: userId, type, text: text || '', mediaUrl: mediaUrl || '', planId: planId || null },
          });

          const sender = await prisma.user.findUnique({
            where:  { id: userId },
            select: { id: true, name: true, phone: true },
          });
          const populated = { ...msg, sender };

          // Update last message + unread counts
          const others = chat.participants.filter((p) => p !== userId);
          const unreadCount = { ...(chat.unreadCount || {}) };
          for (const uid of others) unreadCount[uid] = (unreadCount[uid] || 0) + 1;

          await prisma.chat.update({
            where: { id: chatId },
            data:  {
              lastMessage: { text: text || '', type, senderId: userId, sentAt: new Date().toISOString() },
              unreadCount,
              updatedAt: new Date(),
            },
          });

          io.to(`chat:${chatId}`).emit('message:new', populated);

          for (const uid of others) {
            if (!isOnline(uid)) io.to(`user:${uid}`).emit('notification:message', { chatId, message: populated });
          }
        } catch (e) {
          logger.error(`message:send error: ${e.message}`);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Typing indicators
      socket.on('typing:start', ({ chatId }) => socket.to(`chat:${chatId}`).emit('typing:start', { chatId, userId }));
      socket.on('typing:stop',  ({ chatId }) => socket.to(`chat:${chatId}`).emit('typing:stop',  { chatId, userId }));

      // Read receipt
      socket.on('message:read', async ({ chatId, messageIds }) => {
        try {
          const now = new Date().toISOString();
          await Promise.all(
            messageIds.map((id) =>
              prisma.message.findUnique({ where: { id } }).then((m) => {
                if (!m) return;
                const readBy = m.readBy || [];
                if (!readBy.some((r) => r.userId === userId)) {
                  return prisma.message.update({
                    where: { id },
                    data:  { readBy: [...readBy, { userId, readAt: now }] },
                  });
                }
              })
            )
          );

          const chat = await prisma.chat.findUnique({ where: { id: chatId } });
          if (chat) {
            const updatedUnread = { ...(chat.unreadCount || {}), [userId]: 0 };
            await prisma.chat.update({ where: { id: chatId }, data: { unreadCount: updatedUnread } });
          }

          socket.to(`chat:${chatId}`).emit('message:read', { chatId, userId, messageIds });
        } catch (e) { logger.error(e.message); }
      });

      // Online status query
      socket.on('user:status', ({ userIds }) => {
        const statuses = {};
        for (const uid of userIds) statuses[uid] = isOnline(uid);
        socket.emit('user:statuses', statuses);
      });

      socket.on('disconnect', () => {
        removeOnlineUser(userId, socket.id);
        if (!isOnline(userId)) socket.broadcast.emit('user:offline', { userId });
        logger.info(`Socket disconnected: ${userId}`);
      });
    });

    app.set('io', io);

    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
      logger.info(`📡 API base: http://localhost:${PORT}/api`);
      logger.info(`💬 Socket.IO: enabled`);
      logger.info(`❤️  Health:   http://localhost:${PORT}/health`);
    });

    const shutdown = (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(() => { logger.info('HTTP server closed'); process.exit(0); });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));
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
