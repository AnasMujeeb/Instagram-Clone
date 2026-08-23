const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

const createPost = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content && !req.file) {
      return res.status(400).json({ message: 'Please add some content or an image for the post' });
    }

    const imageUrl = req.file ? req.file.path : '';

    const newPost = await Post.create({
      user: req.user._id,
      content: content || '',
      image: imageUrl,
    });

    const populatedPost = await newPost.populate('user', 'username profilePic name');
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'username profilePic _id')
      .populate('comments.user', 'username profilePic')
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userIdStr = req.user._id.toString();
    const isLiked = post.likes.some((id) => id.toString() === userIdStr);

    if (isLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userIdStr);
      await post.save();
      return res.status(200).json({ message: 'Post unliked', likesCount: post.likes.length });
    } else {
      post.likes.push(req.user._id);
      await post.save();

      if (post.user.toString() !== userIdStr) {
        try {
          const existingNotif = await Notification.findOne({
            recipient: post.user,
            sender: req.user._id,
            type: 'like',
            postId: post._id,
          });

          if (!existingNotif) {
            const notification = await Notification.create({
              recipient: post.user,
              sender: req.user._id,
              type: 'like',
              postId: post._id,
              message: `${req.user.username || 'Someone'} liked your post.`,
            });

            const populatedNotification = await notification.populate('sender', 'username profilePic name');

            const { getIO, getOnlineUsers } = require('../socket');
            const io = getIO();
            const onlineUsers = getOnlineUsers();
            if (io && onlineUsers) {
              const receiverSocketId = onlineUsers.get(post.user.toString());
              if (receiverSocketId) {
                io.to(receiverSocketId).emit('newNotification', populatedNotification);
              }
            }
          }
        } catch (notifErr) {
          console.error('Failed to create like notification:', notifErr);
        }
      }

      return res.status(200).json({ message: 'Post liked', likesCount: post.likes.length });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Comment text cannot be empty' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const newComment = {
      user: req.user._id,
      text,
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    const updatedPost = await Post.findById(req.params.id)
      .populate('user', 'username profilePic')
      .populate('comments.user', 'username profilePic');

    if (post.user.toString() !== req.user._id.toString()) {
      try {
        const notification = await Notification.create({
          recipient: post.user,
          sender: req.user._id,
          type: 'comment',
          postId: post._id,
          message: `${req.user.username || 'Someone'} commented on your post: "${text.slice(0, 50)}"`,
        });

        const populatedNotification = await notification.populate('sender', 'username profilePic name');

        const { getIO, getOnlineUsers } = require('../socket');
        const io = getIO();
        const onlineUsers = getOnlineUsers();
        const receiverSocketId = onlineUsers.get(post.user.toString());
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('newNotification', populatedNotification);
        }
      } catch (notifErr) {
        console.error('Failed to create notification:', notifErr);
      }
    }

    res.status(200).json(updatedPost.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this post' });
    }

    await User.updateMany({}, { $pull: { savedPosts: post._id } });
    await Notification.deleteMany({ postId: post._id });

    await post.deleteOne();
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const userIdStr = req.user._id.toString();
    const isCommentAuthor = comment.user.toString() === userIdStr;
    const isPostOwner = post.user.toString() === userIdStr;

    if (!isCommentAuthor && !isPostOwner) {
      return res.status(401).json({ message: 'Not authorized to delete this comment' });
    }

    post.comments = post.comments.filter((c) => c._id.toString() !== commentId);
    await post.save();

    const updatedPost = await Post.findById(id)
      .populate('user', 'username profilePic')
      .populate('comments.user', 'username profilePic');

    res.status(200).json(updatedPost.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text cannot be empty' });
    }

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to edit this comment' });
    }

    comment.text = text.trim();
    await post.save();

    const updatedPost = await Post.findById(id)
      .populate('user', 'username profilePic')
      .populate('comments.user', 'username profilePic');

    res.status(200).json(updatedPost.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTimelinePosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || '10', 10)));

    const currentUser = await User.findById(req.user._id);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const userIds = [currentUser._id, ...(currentUser.following || [])];

    const posts = await Post.find({ user: { $in: userIds } })
      .populate('user', 'username profilePic')
      .populate('comments.user', 'username profilePic')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to edit this post' });
    }

    const { content } = req.body;
    if (content !== undefined) post.content = content;

    await post.save();

    const updatedPost = await Post.findById(req.params.id)
      .populate('user', 'username profilePic name')
      .populate('comments.user', 'username profilePic');

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPost, getPosts, likePost, addComment, deletePost, getTimelinePosts, updatePost, deleteComment, updateComment };