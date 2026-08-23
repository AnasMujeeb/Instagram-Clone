const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, default: "" },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  profilePic: { type: String, default: "" },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  savedReels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reel' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);