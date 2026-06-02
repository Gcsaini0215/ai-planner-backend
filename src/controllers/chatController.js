'use strict';

const { sendSuccess, sendError } = require('../utils/response');
const prisma = require('../config/prisma');

// ── GET /api/chats ────────────────────────────────────────────────────────────
const getChats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Chats where this user is a participant
    const chats = await prisma.chat.findMany({
      where:   { participants: { has: userId }, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    // Populate participants (fetch user info for all participant IDs)
    const allUserIds = [...new Set(chats.flatMap((c) => c.participants))];
    const users = await prisma.user.findMany({
      where:  { id: { in: allUserIds } },
      select: { id: true, name: true, phone: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const enriched = chats.map((c) => {
      const unread = (c.unreadCount && c.unreadCount[userId]) || 0;
      return {
        ...c,
        participants: c.participants.map((pid) => userMap[pid] || { id: pid }),
        unreadCount:  unread,
      };
    });

    return sendSuccess(res, 200, 'Chats fetched', enriched);
  } catch (e) { next(e); }
};

// ── POST /api/chats ───────────────────────────────────────────────────────────
const openChat = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return sendError(res, 400, 'targetUserId required');

    const me   = req.user.id;
    const them = targetUserId;

    // Find existing chat with exactly these two participants
    let chat = await prisma.chat.findFirst({
      where: {
        AND: [
          { participants: { has: me } },
          { participants: { has: them } },
        ],
      },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: { participants: [me, them] },
      });
    }

    // Populate participants
    const users = await prisma.user.findMany({
      where:  { id: { in: chat.participants } },
      select: { id: true, name: true, phone: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    return sendSuccess(res, 200, 'Chat ready', {
      ...chat,
      participants: chat.participants.map((pid) => userMap[pid] || { id: pid }),
    });
  } catch (e) { next(e); }
};

// ── GET /api/messages/:chatId ─────────────────────────────────────────────────
const getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const userId = req.user.id;

    const chat = await prisma.chat.findFirst({
      where: { id: req.params.chatId, participants: { has: userId } },
    });
    if (!chat) return sendError(res, 403, 'Access denied');

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await prisma.message.count({ where: { chatId: chat.id, isDeleted: false } });

    const messages = await prisma.message.findMany({
      where:   { chatId: chat.id, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      skip,
      take:    parseInt(limit),
    });

    // Populate senders
    const senderIds = [...new Set(messages.map((m) => m.senderId))];
    const senders   = await prisma.user.findMany({
      where:  { id: { in: senderIds } },
      select: { id: true, name: true, phone: true },
    });
    const senderMap = Object.fromEntries(senders.map((u) => [u.id, u]));

    // Mark as read — update readBy JSON array
    const now = new Date().toISOString();
    await Promise.all(
      messages
        .filter((m) => !Array.isArray(m.readBy) || !m.readBy.some((r) => r.userId === userId))
        .map((m) =>
          prisma.message.update({
            where: { id: m.id },
            data:  { readBy: [...(m.readBy || []), { userId, readAt: now }] },
          })
        )
    );

    // Reset unread count for this user
    const updatedUnread = { ...(chat.unreadCount || {}), [userId]: 0 };
    await prisma.chat.update({ where: { id: chat.id }, data: { unreadCount: updatedUnread } });

    const populated = messages.map((m) => ({ ...m, sender: senderMap[m.senderId] || null }));

    return sendSuccess(res, 200, 'Messages fetched', {
      messages: populated.reverse(), total, page: parseInt(page),
    });
  } catch (e) { next(e); }
};

// ── POST /api/messages ────────────────────────────────────────────────────────
const sendMessage = async (req, res, next) => {
  try {
    const { chatId, text, type = 'text', mediaUrl = '', planId } = req.body;
    const userId = req.user.id;

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, participants: { has: userId } },
    });
    if (!chat) return sendError(res, 403, 'Access denied');

    const msg = await prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        type,
        text:    text    || '',
        mediaUrl: mediaUrl || '',
        planId:  planId  || null,
      },
    });

    // Update last message + increment unread for others
    const others     = chat.participants.filter((p) => p !== userId);
    const unreadCount = { ...(chat.unreadCount || {}) };
    for (const uid of others) {
      unreadCount[uid] = (unreadCount[uid] || 0) + 1;
    }

    await prisma.chat.update({
      where: { id: chatId },
      data:  {
        lastMessage: { text: text || '', type, senderId: userId, sentAt: new Date().toISOString() },
        unreadCount,
        updatedAt: new Date(),
      },
    });

    const sender = await prisma.user.findUnique({
      where:  { id: userId },
      select: { id: true, name: true, phone: true },
    });

    return sendSuccess(res, 201, 'Message sent', { ...msg, sender });
  } catch (e) { next(e); }
};

// ── DELETE /api/messages/:id ──────────────────────────────────────────────────
const deleteMessage = async (req, res, next) => {
  try {
    const msg = await prisma.message.findFirst({
      where: { id: req.params.id, senderId: req.user.id },
    });
    if (!msg) return sendError(res, 404, 'Message not found');

    await prisma.message.update({
      where: { id: req.params.id },
      data:  { isDeleted: true, text: '' },
    });
    return sendSuccess(res, 200, 'Message deleted');
  } catch (e) { next(e); }
};

module.exports = { getChats, openChat, getMessages, sendMessage, deleteMessage };
