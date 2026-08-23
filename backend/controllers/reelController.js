const Reel = require('../models/Reel');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { cloudinary } = require('../config/cloudinary');

const getCloudinaryPublicId = (mediaUrl) => {
  if (!mediaUrl || typeof mediaUrl !== 'string') return null;
  try {
    const uploadIndex = mediaUrl.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    const afterUpload = mediaUrl.slice(uploadIndex + 8);
    const withoutVersion = afterUpload.replace(/^v\d+\//, '');
    const lastSlash = withoutVersion.lastIndexOf('/');
    const fileName = lastSlash >= 0 ? withoutVersion.slice(lastSlash + 1) : withoutVersion;
    const dotIndex = fileName.lastIndexOf('.');
    const withoutExtension = dotIndex > -1 ? fileName.slice(0, dotIndex) : fileName;
    const publicId = withoutVersion.slice(0, withoutVersion.length - (fileName.length - withoutExtension.length));

    return publicId ? `${publicId}${withoutExtension}` : withoutExtension || null;
  } catch (error) {
    return null;
  }
};

const createReel = async (req, res) => {
  try {
    const { caption } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a video for the reel' });
    }

    const reel = await Reel.create({
      user: req.user._id,
      videoUrl: req.file.path,
      caption: caption || '',
    });

    const populatedReel = await reel.populate('user', 'username profilePic name');
    res.status(201).json(populatedReel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReels = async (req, res) => {
  try {
    const reels = await Reel.find()
      .populate('user', 'username profilePic name')
      .populate('comments.user', 'username profilePic name')
      .sort({ createdAt: -1 });

    res.status(200).json(reels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const likeReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    if (reel.likes.includes(req.user._id)) {
      reel.likes = reel.likes.filter((id) => id.toString() !== req.user._id.toString());
      await reel.save();
      return res.status(200).json({ message: 'Reel unliked', likesCount: reel.likes.length });
    } else {
      reel.likes.push(req.user._id);
      await reel.save();

      if (reel.user.toString() !== req.user._id.toString()) {
        try {
          const existingNotif = await Notification.findOne({
            recipient: reel.user,
            sender: req.user._id,
            type: 'like',
            reelId: reel._id,
          });

          if (!existingNotif) {
            const notification = await Notification.create({
              recipient: reel.user,
              sender: req.user._id,
              type: 'like',
              reelId: reel._id,
              message: `${req.user.username || 'Someone'} liked your reel.`,
            });

            const populatedNotification = await notification.populate('sender', 'username profilePic name');

            const { getIO, getOnlineUsers } = require('../socket');
            const io = getIO();
            const onlineUsers = getOnlineUsers();
            if (io && onlineUsers) {
              const receiverSocketId = onlineUsers.get(reel.user.toString());
              if (receiverSocketId) {
                io.to(receiverSocketId).emit('newNotification', populatedNotification);
              }
            }
          }
        } catch (notifErr) {
          console.error('Failed to create reel like notification:', notifErr);
        }
      }

      return res.status(200).json({ message: 'Reel liked', likesCount: reel.likes.length });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addReelComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Comment text cannot be empty' });
    }

    const reel = await Reel.findById(req.params.id);
    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    reel.comments.push({
      user: req.user._id,
      text,
    });
    await reel.save();

    const updatedReel = await Reel.findById(req.params.id)
      .populate('user', 'username profilePic name')
      .populate('comments.user', 'username profilePic name');

    res.status(200).json(updatedReel.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });

    if (reel.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this reel' });
    }

    const publicId = getCloudinaryPublicId(reel.videoUrl);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      } catch (cleanupError) {
        console.error('Cloudinary cleanup failed for reel delete:', cleanupError.message || cleanupError);
      }
    }

    await User.updateMany({}, { $pull: { savedReels: reel._id } });

    await Reel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Reel deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteReelComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const reel = await Reel.findById(id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });

    const comment = reel.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const userIdStr = req.user._id.toString();
    const isCommentAuthor = comment.user.toString() === userIdStr;
    const isReelOwner = reel.user.toString() === userIdStr;

    if (!isCommentAuthor && !isReelOwner) {
      return res.status(401).json({ message: 'Not authorized to delete this comment' });
    }

    reel.comments = reel.comments.filter((c) => c._id.toString() !== commentId);
    await reel.save();

    const updatedReel = await Reel.findById(id)
      .populate('user', 'username profilePic name')
      .populate('comments.user', 'username profilePic name');

    res.status(200).json(updatedReel.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateReelComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text cannot be empty' });
    }

    const reel = await Reel.findById(id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });

    const comment = reel.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to edit this comment' });
    }

    comment.text = text.trim();
    await reel.save();

    const updatedReel = await Reel.findById(id)
      .populate('user', 'username profilePic name')
      .populate('comments.user', 'username profilePic name');

    res.status(200).json(updatedReel.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleSaveReel = async (req, res) => {
  try {
    const reelId = req.params.id;
    const reel = await Reel.findById(reelId);

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isSaved = user.savedReels.some((id) => id.toString() === reelId);

    if (isSaved) {
      user.savedReels = user.savedReels.filter((id) => id.toString() !== reelId);
      await user.save();
      return res.status(200).json({ message: 'Reel unsaved successfully', saved: false });
    }

    user.savedReels.push(reelId);
    await user.save();
    return res.status(200).json({ message: 'Reel saved successfully', saved: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSavedReelIds = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('savedReels');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json((user.savedReels || []).map((id) => id.toString()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSavedReels = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedReels',
      populate: [
        { path: 'user', select: 'username name profilePic' },
        { path: 'comments.user', select: 'username name profilePic' },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const validReels = (user.savedReels || []).filter((reel) => reel !== null);
    res.status(200).json(validReels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createReel, getReels, likeReel, addReelComment, toggleSaveReel, getSavedReelIds, getSavedReels, deleteReel, deleteReelComment, updateReelComment };