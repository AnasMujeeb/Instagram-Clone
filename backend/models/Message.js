const mongoose = require('mongoose');

const MESSAGE_STATUS = Object.freeze({
  SENT: 'sent',
  DELIVERED: 'delivered',
  SEEN: 'seen',
});

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(MESSAGE_STATUS),
      default: MESSAGE_STATUS.SENT,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
module.exports.MESSAGE_STATUS = MESSAGE_STATUS;