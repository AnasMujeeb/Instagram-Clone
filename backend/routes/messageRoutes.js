const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMessages,
  sendMessage,
  getUserConversations,
  createOrGetConversation,
  updateMessageStatus,
} = require('../controllers/messageController');

router.post('/conversation', protect, createOrGetConversation);
router.get('/conversation/:userId', protect, getUserConversations);
router.post('/message', protect, sendMessage);
router.patch('/message/:messageId/status', protect, updateMessageStatus);
router.get('/message/:conversationId', protect, getMessages);

module.exports = router;