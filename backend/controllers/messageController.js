const Conversation = require('../models/Conversation.js');
const Message = require('../models/Message.js');
const { MESSAGE_STATUS } = require('../models/Message.js');

const getConversationForUser = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return null;

  const isMember = conversation.members.some(
    (memberId) => memberId.toString() === userId.toString()
  );

  return isMember ? conversation : null;
};

const statusPriority = {
  [MESSAGE_STATUS.SENT]: 1,
  [MESSAGE_STATUS.DELIVERED]: 2,
  [MESSAGE_STATUS.SEEN]: 3,
};

const normalizeStatus = (status) => {
  if (!Object.values(MESSAGE_STATUS).includes(status)) return MESSAGE_STATUS.SENT;
  return status;
};

const canUpdateMessageStatus = (message, userId, targetStatus) => {
  if (!message || !userId) return false;

  const currentStatus = normalizeStatus(message.status);
  const priority = statusPriority[currentStatus] || 0;
  const nextPriority = statusPriority[targetStatus] || 0;

  if (nextPriority <= priority) return false;

  return message.sender.toString() !== userId.toString();
};

const createOrGetConversation = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({ error: 'receiverId is required' });
    }

    if (receiverId.toString() === senderId.toString()) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        members: [senderId, receiverId],
      });
      await conversation.save();
    }

    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUserConversations = async (req, res) => {
  try {
    if (req.params.userId !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to access these conversations' });
    }

    const conversations = await Conversation.find({
      members: { $in: [req.user._id] },
    }).populate('members', 'username profilePic name');

    res.status(200).json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body;

    if (!conversationId || !text?.trim()) {
      return res.status(400).json({ error: 'conversationId and text are required' });
    }

    const conversation = await getConversationForUser(conversationId, req.user._id);
    if (!conversation) {
      return res.status(403).json({ error: 'Not authorized to send messages in this conversation' });
    }

    const newMessage = new Message({
      conversationId,
      sender: req.user._id,
      text: text.trim(),
      status: MESSAGE_STATUS.SENT,
    });
    const savedMessage = await newMessage.save();
    res.status(200).json(savedMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateMessageStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const targetStatus = normalizeStatus(status);

    if (!Object.values(MESSAGE_STATUS).includes(targetStatus)) {
      return res.status(400).json({ error: 'Invalid message status' });
    }

    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const conversation = await getConversationForUser(message.conversationId, req.user._id);
    if (!conversation) {
      return res.status(403).json({ error: 'Not authorized to update this message status' });
    }

    const actualRecipientId = conversation.members.find(
      (memberId) => memberId.toString() !== message.sender.toString()
    );

    if (!actualRecipientId || actualRecipientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the actual recipient can update message delivery status' });
    }

    if (!canUpdateMessageStatus(message, req.user._id, targetStatus)) {
      return res.status(200).json(message);
    }

    message.status = targetStatus;
    await message.save();

    res.status(200).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const conversation = await getConversationForUser(req.params.conversationId, req.user._id);
    if (!conversation) {
      return res.status(403).json({ error: 'Not authorized to access these messages' });
    }

    const messages = await Message.find({
      conversationId: req.params.conversationId,
    }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  getUserConversations,
  createOrGetConversation,
  updateMessageStatus,
};
