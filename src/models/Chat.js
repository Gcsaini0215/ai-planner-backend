'use strict';
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{
    type:  mongoose.Schema.Types.ObjectId,
    ref:   'User',
  }],
  lastMessage: {
    text:      { type: String, default: '' },
    type:      { type: String, default: 'text' },
    senderId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt:    { type: Date },
  },
  unreadCount: {
    type: Map,
    of:   Number,
    default: {},
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });

chatSchema.index({ participants: 1 });
chatSchema.index({ 'lastMessage.sentAt': -1 });

module.exports = mongoose.model('Chat', chatSchema);
