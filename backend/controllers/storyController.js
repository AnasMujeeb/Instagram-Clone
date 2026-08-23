const Story = require('../models/Story');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

const getResourceType = (story) => {
  if (story?.mediaType === 'video') return 'video';
  if (story?.mediaType === 'image') return 'image';

  const mediaUrl = story?.mediaUrl || story?.image || story?.imageUrl || story?.media || story?.url || story?.path || '';
  if (/\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(mediaUrl)) return 'video';
  return 'image';
};

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

const createStory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image or video for the story' });
    }

    const mimetype = req.file.mimetype || '';
    const isVideo = mimetype.startsWith('video');
    const mediaUrl = req.file.path;

    const storyData = {
      user: req.user._id,
      mediaUrl,
      mediaType: isVideo ? 'video' : 'image',
    };

    if (!isVideo) storyData.image = mediaUrl;

    const story = await Story.create(storyData);

    const populatedStory = await story.populate('user', 'username profilePic name');
    res.status(201).json(populatedStory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cleanupExpiredStories = async () => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const expiredStories = await Story.find({ createdAt: { $lt: twentyFourHoursAgo } });

    for (const story of expiredStories) {
      const mediaUrl = story.mediaUrl || story.image || story.imageUrl || story.media || story.url || story.path;
      const publicId = getCloudinaryPublicId(mediaUrl);
      const resourceType = getResourceType(story);

      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        } catch (cleanupError) {
          console.error('Cloudinary cleanup error for expired story:', cleanupError.message || cleanupError);
        }
      }
      await Story.findByIdAndDelete(story._id);
    }
  } catch (err) {
    console.error('Story expiration cleanup job error:', err.message || err);
  }
};

const getStories = async (req, res) => {
  try {
    cleanupExpiredStories();

    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userIds = [req.user._id, ...currentUser.following];

    const stories = await Story.find({ user: { $in: userIds } })
      .populate('user', 'username profilePic name')
      .populate('viewers', 'username profilePic name')
      .sort({ createdAt: -1 });

    const groupedStoriesMap = {};
    stories.forEach((story) => {
      if (!story.user) return;
      const userId = story.user._id.toString();
      if (!groupedStoriesMap[userId]) {
        groupedStoriesMap[userId] = {
          user: story.user,
          stories: [],
        };
      }
      groupedStoriesMap[userId].stories.push(story);
    });

    const result = Object.values(groupedStoriesMap);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id).populate('viewers', 'username profilePic name');
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    const viewerId = req.user._id.toString();
    const ownerId = story.user?.toString();

    if (ownerId === viewerId) {
      return res.status(200).json({
        message: 'Story owner cannot be counted as a viewer',
        viewers: story.viewers
      });
    }

    const alreadyViewed = story.viewers.some((viewer) => {
      if (!viewer) return false;
      const existingViewerId = viewer._id ? viewer._id.toString() : viewer.toString();
      return existingViewerId === viewerId;
    });

    if (!alreadyViewed) {
      story.viewers.push(req.user._id);
      await story.save();
      await story.populate('viewers', 'username profilePic name');
    }

    res.status(200).json({
      message: alreadyViewed ? 'Story already viewed' : 'Story viewed successfully',
      viewers: story.viewers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this story' });
    }

    const mediaUrl = story.mediaUrl || story.image || story.imageUrl || story.media || story.url || story.path;
    const publicId = getCloudinaryPublicId(mediaUrl);
    const resourceType = getResourceType(story);

    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      } catch (cleanupError) {
        console.error('Cloudinary cleanup failed for story delete:', cleanupError.message || cleanupError);
      }
    }

    await Story.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Story deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createStory, getStories, viewStory, deleteStory };