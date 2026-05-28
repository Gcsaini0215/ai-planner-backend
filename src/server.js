'use strict';

require('dotenv').config();

const http      = require('http');
const { Server } = require('socket.io');
const app       = require('./app');
const connectDB = require('./config/database');
const logger    = require('./utils/logger');
const Chat      = require('./models/Chat');
const Message   = require('./models/Message');
const { verifyToken } = require('./utils/jwt');

const PORT = parseInt(process.env.PORT, 10) || 5002;

// ── Track online users: Map<userId, socketId[]> ───────────────────────────────
const onlineUsers = new Map();

const addOnlineUser = (userId, socketId) => {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
};

const removeOnlineUser = (userId, socketId) => {
  const sockets = onlineUsers.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) onlineUsers.delete(userId);
  }
};

const isOnline = (userId) => onlineUsers.has(userId.toString());

// ─────────────────────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);

    // ── Socket.IO init ────────────────────────────────────────────────────────
    const io = new Server(server, {
      cors: {
        origin:      process.env.ALLOWED_ORIGINS ?? '*',
        credentials: true,
      },
      pingTimeout:  60000,
      pingInterval: 25000,
    });

    // ── Auth middleware ───────────────────────────────────────────────────────
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token
          || socket.handshake.headers?.authorization?.replace('Bearer ', '');
        if (!token) return next(new Error('Unauthorised'));

        const payload = verifyToken(token);
        if (!payload) return next(new Error('Invalid token'));

        socket.userId   = payload.userId || payload.id || payload._id;
        socket.userName = payload.name || '';
        next();
      } catch (err) {
        next(new Error('Auth error'));
      }
    });

    // ── Connection handler ────────────────────────────────────────────────────
    io.on('connection', (socket) => {
      const userId = socket.userId.toString();
      logger.info(`Socket connected: ${userId}`);

      addOnlineUser(userId, socket.id);

      // Let everyone in the user's chats know they're online
      socket.broadcast.emit('user:online', { userId });

      // ── Join personal room ──────────────────────────────────────────────
      socket.join(`user:${userId}`);

      // ── Join a chat room ────────────────────────────────────────────────
      socket.on('chat:join', async ({ chatId }) => {
        try {
          const chat = await Chat.findOne({
            _id: chatId,
            participants: userId,
          });
          if (chat) socket.join(`chat:${chatId}`);
        } catch (e) { logger.error(e.message); }
      });

      // ── Send message ────────────────────────────────────────────────────
      socket.on('message:send', async (data) => {
        try {
          const { chatId, text, type = 'text', mediaUrl = '', planId } = data;

          const chat = await Chat.findOne({ _id: chatId, participants: userId });
          if (!chat) return socket.emit('error', { message: 'Access denied' });

          const msg = await Message.create({
            chatId,
            senderId: userId,
            type,
            text:     text     || '',
            mediaUrl: mediaUrl || '',
            planId:   planId   || undefined,
          });

          const populated = await Message.findById(msg._id)
            .populate('senderId', 'name phone')
            .lean();

          // Update last message + unread for others
          const others = chat.participants.filter(p => p.toString() !== userId);
          const unreadUpdate = {};
          for (const uid of others) {
            const curr = chat.unreadCount?.get?.(uid.toString()) || 0;
            unreadUpdate[`unreadCount.${uid}`] = curr + 1;
          }
          await Chat.findByIdAndUpdate(chatId, {
            $set: {
              lastMessage: {
                text: text || '', type,
                senderId: userId, sentAt: new Date(),
              },
              ...unreadUpdate,
            },
          });

          // Broadcast to chat room
          io.to(`chat:${chatId}`).emit('message:new', populated);

          // Push notification to offline participants
          for (const uid of others) {
            if (!isOnline(uid.toString())) {
              io.to(`user:${uid}`).emit('notification:message', {
                chatId,
                message: populated,
              });
            }
          }
        } catch (e) {
          logger.error(`message:send error: ${e.message}`);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // ── Typing indicators ───────────────────────────────────────────────
      socket.on('typing:start', ({ chatId }) => {
        socket.to(`chat:${chatId}`).emit('typing:start', { chatId, userId });
      });

      socket.on('typing:stop', ({ chatId }) => {
        socket.to(`chat:${chatId}`).emit('typing:stop', { chatId, userId });
      });

      // ── Read receipt ────────────────────────────────────────────────────
      socket.on('message:read', async ({ chatId, messageIds }) => {
        try {
          await Message.updateMany(
            { _id: { $in: messageIds }, 'readBy.userId': { $ne: userId } },
            { $push: { readBy: { userId, readAt: new Date() } } },
          );
          await Chat.findByIdAndUpdate(chatId, {
            $set: { [`unreadCount.${userId}`]: 0 },
          });
          socket.to(`chat:${chatId}`).emit('message:read', { chatId, userId, messageIds });
        } catch (e) { logger.error(e.message); }
      });

      // ── Online status query ─────────────────────────────────────────────
      socket.on('user:status', ({ userIds }) => {
        const statuses = {};
        for (const uid of userIds) {
          statuses[uid] = isOnline(uid);
        }
        socket.emit('user:statuses', statuses);
      });

      // ── Disconnect ──────────────────────────────────────────────────────
      socket.on('disconnect', () => {
        removeOnlineUser(userId, socket.id);
        if (!isOnline(userId)) {
          socket.broadcast.emit('user:offline', { userId });
        }
        logger.info(`Socket disconnected: ${userId}`);
      });
    });

    // Attach io to app so controllers can emit events if needed
    app.set('io', io);

    // ── HTTP server listen ────────────────────────────────────────────────────
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
      logger.info(`📡 API base: http://localhost:${PORT}/api`);
      logger.info(`💬 Socket.IO: enabled`);
      logger.info(`❤️  Health:   http://localhost:${PORT}/health`);
    });

    // ── Graceful shutdown ─────────────────────────────────────────────────────
    const shutdown = (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
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
