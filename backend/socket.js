const { Server } = require('socket.io');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

let io;
const onlineUsers = new Map();
const recentlySavedMessages = new Map();
const recentlyUpdatedStatuses = new Map();

const normalizeSocketUserId = (value) => {
  if (!value) return null;
  return value.toString();
};

const makeMessageDedupKey = ({ conversationId, sender, receiverId, text }) => {
  return [conversationId, sender, receiverId, text?.trim()].filter(Boolean).join(':');
};

const statusPriority = {
  sent: 1,
  delivered: 2,
  seen: 3,
};

const normalizeStatus = (status) => {
  if (!status || !statusPriority[status]) return 'sent';
  return status;
};

const ensureStatusTransitionAllowed = (currentStatus, targetStatus) => {
  const currentPriority = statusPriority[currentStatus] || 0;
  const targetPriority = statusPriority[targetStatus] || 0;
  return targetPriority > currentPriority;
};

async function emitMessageStatus({ socket, message, status, actorId }) {
  const senderId = message.sender?.toString?.() || message.sender;
  const conversationId = message.conversationId?.toString?.() || message.conversationId;
  const recipientId = actorId.toString();
  const payload = {
    messageId: message._id.toString(),
    conversationId,
    senderId,
    recipientId,
    status,
    updatedAt: new Date().toISOString(),
  };

  const senderSocketId = onlineUsers.get(senderId);
  if (senderSocketId) {
    io.to(senderSocketId).emit('messageStatus', payload);
  }

  if (socket) {
    socket.emit('messageStatus', payload);
  }
}

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join', (userId) => {
      const normalizedUserId = normalizeSocketUserId(userId);
      if (!normalizedUserId) return;

      const existingSocketId = onlineUsers.get(normalizedUserId);
      if (existingSocketId && existingSocketId !== socket.id) {
        const staleSocket = io.sockets.sockets.get(existingSocketId);
        if (staleSocket) {
          staleSocket.disconnect(true);
        }
      }

      socket.data.userId = normalizedUserId;
      onlineUsers.set(normalizedUserId, socket.id);
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
      console.log(`User ${normalizedUserId} joined. Online users: ${onlineUsers.size}`);
    });

    socket.on('sendMessage', async (data) => {
      try {
        const conversationId = normalizeSocketUserId(data?.conversationId);
        const senderId = normalizeSocketUserId(data?.sender);
        const receiverId = normalizeSocketUserId(data?.receiverId);
        const text = typeof data?.text === 'string' ? data.text.trim() : '';

        if (!conversationId || !senderId || !receiverId || !text) {
          socket.emit('messageError', { error: 'Invalid message payload' });
          return;
        }

        if (senderId === receiverId) {
          socket.emit('messageError', { error: 'Sender and receiver cannot be the same user' });
          return;
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit('messageError', { error: 'Conversation not found' });
          return;
        }

        const isMember = conversation.members.some((memberId) => memberId.toString() === senderId)
          && conversation.members.some((memberId) => memberId.toString() === receiverId);

        if (!isMember) {
          socket.emit('messageError', { error: 'User is not a member of this conversation' });
          return;
        }

        const dedupeKey = makeMessageDedupKey({ conversationId, sender: senderId, receiverId, text });
        const now = Date.now();
        const lastSaved = recentlySavedMessages.get(dedupeKey) || 0;

        if (now - lastSaved < 5000) {
          socket.emit('messageError', { error: 'Message already processed' });
          return;
        }

        const duplicateMessage = await Message.findOne({
          conversationId,
          sender: senderId,
          text,
          createdAt: { $gte: new Date(now - 10000) },
        }).sort({ createdAt: -1 }).lean();

        if (duplicateMessage) {
          recentlySavedMessages.set(dedupeKey, now);
          socket.emit('messageSent', duplicateMessage);
          return;
        }

        const newMessage = new Message({
          conversationId,
          sender: senderId,
          text,
          status: 'sent',
        });

        const savedMessage = await newMessage.save();
        recentlySavedMessages.set(dedupeKey, now);

        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receiveMessage', {
            ...savedMessage.toObject(),
            conversationId,
          });
        }

        socket.emit('messageSent', savedMessage.toObject());
      } catch (err) {
        console.error('Socket sendMessage error:', err);
        socket.emit('messageError', { error: 'Failed to send message' });
      }
    });

    const handleStatusUpdate = async ({ messageId, conversationId, userId, status, type }) => {
      const normalizedMessageId = normalizeSocketUserId(messageId);
      const normalizedConversationId = normalizeSocketUserId(conversationId);
      const normalizedUserId = normalizeSocketUserId(userId);
      const targetStatus = normalizeStatus(status || type);

      if (!normalizedMessageId || !normalizedConversationId || !normalizedUserId || !targetStatus) return;

      const dedupeKey = `${normalizedMessageId}:${targetStatus}`;
      const now = Date.now();
      if (now - (recentlyUpdatedStatuses.get(dedupeKey) || 0) < 5000) return;

      try {
        const message = await Message.findById(normalizedMessageId);
        if (!message) return;

        if (message.conversationId.toString() !== normalizedConversationId) return;

        const conversation = await Conversation.findById(normalizedConversationId);
        if (!conversation) return;

        const actualRecipientId = conversation.members.find(
          (memberId) => memberId.toString() !== message.sender.toString()
        );

        if (!actualRecipientId || actualRecipientId.toString() !== normalizedUserId) {
          socket.emit('messageError', { error: 'Only the actual recipient can update message status' });
          return;
        }

        const currentStatus = normalizeStatus(message.status);
        if (!ensureStatusTransitionAllowed(currentStatus, targetStatus)) {
          return;
        }

        message.status = targetStatus;
        await message.save();
        recentlyUpdatedStatuses.set(dedupeKey, now);
        await emitMessageStatus({ socket, message, status: targetStatus, actorId: normalizedUserId });
      } catch (err) {
        console.error('Socket status update error:', err);
        socket.emit('messageError', { error: 'Failed to update message status' });
      }
    };

    socket.on('markDelivered', (payload) => handleStatusUpdate({ ...payload, status: 'delivered' }));
    socket.on('markSeen', (payload) => handleStatusUpdate({ ...payload, status: 'seen' }));

    socket.on('typing', ({ conversationId, senderId, receiverId }) => {
      const normalizedConversationId = normalizeSocketUserId(conversationId);
      const normalizedSenderId = normalizeSocketUserId(senderId);
      const normalizedReceiverId = normalizeSocketUserId(receiverId);

      if (!normalizedConversationId || !normalizedSenderId || !normalizedReceiverId) return;
      if (normalizedSenderId === normalizedReceiverId) return;

      const receiverSocketId = onlineUsers.get(normalizedReceiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('userTyping', {
          conversationId: normalizedConversationId,
          senderId: normalizedSenderId,
          isTyping: true,
        });
      }
    });

    socket.on('stopTyping', ({ conversationId, senderId, receiverId }) => {
      const normalizedConversationId = normalizeSocketUserId(conversationId);
      const normalizedSenderId = normalizeSocketUserId(senderId);
      const normalizedReceiverId = normalizeSocketUserId(receiverId);

      if (!normalizedConversationId || !normalizedSenderId || !normalizedReceiverId) return;
      if (normalizedSenderId === normalizedReceiverId) return;

      const receiverSocketId = onlineUsers.get(normalizedReceiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('userTyping', {
          conversationId: normalizedConversationId,
          senderId: normalizedSenderId,
          isTyping: false,
        });
      }
    });

    socket.on('markRead', ({ conversationId, userId }) => {
      const normalizedConversationId = normalizeSocketUserId(conversationId);
      const normalizedUserId = normalizeSocketUserId(userId);

      if (!normalizedConversationId || !normalizedUserId) return;

      socket.emit('conversationRead', {
        conversationId: normalizedConversationId,
        userId: normalizedUserId,
      });
    });

    socket.on('disconnect', () => {
      const userId = socket.data.userId;

      if (userId && onlineUsers.get(userId) === socket.id) {
        onlineUsers.delete(userId);
      }

      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
      console.log('Socket disconnected:', socket.id, '- Online users:', onlineUsers.size);
    });
  });

  return io;
}

function getIO() {
  return io;
}

function getOnlineUsers() {
  return onlineUsers;
}

module.exports = { initSocket, getIO, getOnlineUsers };
