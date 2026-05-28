'use strict';
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Chat',
    required: true,
    index:    true,
  },
  senderId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  type: {
    type:    String,
    enum:    ['text', 'image', 'audio', 'file', 'plan_share'],
    default: 'text',
  },
  text:     { type: String, default: '' },
  mediaUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  planId:   { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplacePlan' },

  readBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now },
  }],
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

messageSchema.index({ chatId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
