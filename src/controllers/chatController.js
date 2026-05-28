'use strict';

const { sendSuccess, sendError } = require('../utils/response');
const Chat    = require('../models/Chat');
const Message = require('../models/Message');
const mongoose = require('mongoose');

// ── GET /api/chats — user's chat list ─────────────────────────────────────────
const getChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
      isActive:     true,
    })
      .populate('participants', 'name phone')
      .sort({ 'lastMessage.sentAt': -1 })
      .lean();

    const enriched = chats.map(c => ({
      ...c,
      unreadCount: c.unreadCount?.[req.user._id.toString()] || 0,
    }));

    return sendSuccess(res, 200, 'Chats fetched', enriched);
  } catch (e) { next(e); }
};

// ── POST /api/chats — open/find a chat ───────────────────────────────────────
const openChat = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return sendError(res, 400, 'targetUserId required');

    const me = req.user._id;
    const them = new mongoose.Types.ObjectId(targetUserId);

    // Find existing
    let chat = await Chat.findOne({
      participants: { $all: [me, them], $size: 2 },
    }).populate('participants', 'name phone');

    if (!chat) {
      chat = await Chat.create({ participants: [me, them] });
      chat = await chat.populate('participants', 'name phone');
    }

    return sendSuccess(res, 200, 'Chat ready', chat);
  } catch (e) { next(e); }
};

// ── GET /api/messages/:chatId ─────────────────────────────────────────────────
const getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user._id,
    });
    if (!chat) return sendError(res, 403, 'Access denied');

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Message.countDocuments({ chatId: chat._id, isDeleted: false });
    const messages = await Message.find({ chatId: chat._id, isDeleted: false })
      .populate('senderId', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Mark as read
    await Message.updateMany(
      { chatId: chat._id, 'readBy.userId': { $ne: req.user._id } },
      { $push: { readBy: { userId: req.user._id, readAt: new Date() } } },
    );

    // Reset unread count
    await Chat.findByIdAndUpdate(chat._id, {
      $set: { [`unreadCount.${req.user._id}`]: 0 },
    });

    return sendSuccess(res, 200, 'Messages fetched', {
      messages: messages.reverse(), total,
      page: parseInt(page),
    });
  } catch (e) { next(e); }
};

// ── POST /api/messages — send (REST fallback, Socket.IO is primary) ───────────
const sendMessage = async (req, res, next) => {
  try {
    const { chatId, text, type = 'text', mediaUrl = '', planId } = req.body;

    const chat = await Chat.findOne({ _id: chatId, participants: req.user._id });
    if (!chat) return sendError(res, 403, 'Access denied');

    const msg = await Message.create({
      chatId,
      senderId: req.user._id,
      type, text: text || '',
      mediaUrl: mediaUrl || '',
      planId:   planId   || undefined,
    });

    // Update last message + unread counts for others
    const others = chat.participants.filter(
      p => p.toString() !== req.user._id.toString(),
    );
    const unreadUpdate = {};
    for (const uid of others) {
      const current = chat.unreadCount?.get?.(uid.toString()) || 0;
      unreadUpdate[`unreadCount.${uid}`] = current + 1;
    }

    await Chat.findByIdAndUpdate(chatId, {
      $set: {
        lastMessage: { text: text || '', type, senderId: req.user._id, sentAt: new Date() },
        ...unreadUpdate,
      },
    });

    const populated = await msg.populate('senderId', 'name phone');
    return sendSuccess(res, 201, 'Message sent', populated);
  } catch (e) { next(e); }
};

// ── DELETE /api/messages/:id ──────────────────────────────────────────────────
const deleteMessage = async (req, res, next) => {
  try {
    const msg = await Message.findOneAndUpdate(
      { _id: req.params.id, senderId: req.user._id },
      { $set: { isDeleted: true, text: '' } },
      { new: true },
    );
    if (!msg) return sendError(res, 404, 'Message not found');
    return sendSuccess(res, 200, 'Message deleted');
  } catch (e) { next(e); }
};

module.exports = { getChats, openChat, getMessages, sendMessage, deleteMessage };
