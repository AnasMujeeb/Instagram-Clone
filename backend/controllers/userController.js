const User = require('../models/User');
const Notification = require('../models/Notification');


const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const followUser = async (req, res) => {
    if (req.user._id.toString() === req.params.id) {
        return res.status(400).json({ message: "You cannot follow yourself" });
    }

    try {
        const userToModify = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user._id);

        if (!userToModify || !currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isFollowing = currentUser.following.includes(req.params.id);

        if (isFollowing) {
            currentUser.following = currentUser.following.filter(
                (id) => id.toString() !== req.params.id
            );
            userToModify.followers = userToModify.followers.filter(
                (id) => id.toString() !== req.user._id.toString()
            );

            await currentUser.save();
            await userToModify.save();
            res.status(200).json({ message: 'Unfollowed' });
        } else {
            currentUser.following.push(req.params.id);
            userToModify.followers.push(req.user._id);

            await currentUser.save();
            await userToModify.save();

            if (req.user._id.toString() !== req.params.id) {
                const notification = await Notification.create({
                    recipient: req.params.id,
                    sender: req.user._id,
                    type: 'follow',
                    message: `${req.user.username || 'Someone'} started following you.`,
                });

                const populatedNotification = await notification.populate('sender', 'username profilePic name');

                const { getIO, getOnlineUsers } = require('../socket');
                const io = getIO();
                const onlineUsers = getOnlineUsers();
                const receiverSocketId = onlineUsers.get(req.params.id);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('newNotification', populatedNotification);
                }
            }

            res.status(200).json({ message: 'Followed' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserByUsername = async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findOne({ username: new RegExp(`^${username.trim()}$`, 'i') }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserFollowers = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('followers', 'username name profilePic followers');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user.followers || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserFollowing = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('following', 'username name profilePic followers');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user.following || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name !== undefined ? req.body.name : user.name;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
      
      if (req.file) {
        user.profilePic = req.file.path;
      } else if (req.body.profilePic) {
        user.profilePic = req.body.profilePic;
      }

      const updatedUser = await user.save();

      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio,
        profilePic: updatedUser.profilePic,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchUsers = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || !query.trim()) {
      return res.status(200).json([]);
    }

    const regex = new RegExp(query.trim(), 'i');
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ username: regex }, { name: regex }],
    })
      .select('username name profilePic')
      .limit(20);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSuggestions = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const excludeIds = [req.user._id, ...currentUser.following];

    const suggestions = await User.find({
      _id: { $nin: excludeIds },
    })
      .select('username name profilePic')
      .limit(10);

    res.status(200).json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const toggleSavePost = async (req, res) => {
  try {
    const Post = require('../models/Post');
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isSaved = user.savedPosts.some((id) => id.toString() === postId);

    if (isSaved) {
      user.savedPosts = user.savedPosts.filter((id) => id.toString() !== postId);
      await user.save();
      return res.status(200).json({ message: 'Post unsaved successfully', saved: false });
    } else {
      user.savedPosts.push(postId);
      await user.save();
      return res.status(200).json({ message: 'Post saved successfully', saved: true });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSavedPosts = async (req, res) => {
  console.log("=== HIT GET SAVED POSTS ROUTE ===");
  try {
    console.log("Current User ID:", req.user?._id);

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized, no user ID" });
    }

    const user = await User.findById(req.user._id).populate({
      path: 'savedPosts',
      populate: {
        path: 'user',
        select: 'username name profilePic'
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }


    const validPosts = (user.savedPosts || []).filter((post) => post !== null);

    res.status(200).json(validPosts);
  } catch (error) {
    console.error("CRASH ERROR IN getSavedPosts:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUserProfile, followUser, updateProfile, searchUsers, getSuggestions, toggleSavePost, getSavedPosts, getUserByUsername, getUserFollowers, getUserFollowing };