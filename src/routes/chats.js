'use strict';
const router = require('express').Router();
const c      = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/',              c.getChats);
router.post('/',             c.openChat);
router.get('/messages/:chatId', c.getMessages);
router.post('/messages',     c.sendMessage);
router.delete('/messages/:id', c.deleteMessage);
module.exports = router;
