const express = require('express');
const router = express.Router();
const { getUserProfile, followUser, updateProfile, searchUsers, getSuggestions, toggleSavePost, getSavedPosts, getUserByUsername, getUserFollowers, getUserFollowing } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.get('/search', protect, searchUsers);
router.get('/saved', protect, getSavedPosts);
router.post('/save/:id', protect, toggleSavePost);
router.get('/suggestions', protect, getSuggestions);
router.get('/username/:username', protect, getUserByUsername);
router.put('/profile/update', protect, upload.single('profilePic'), updateProfile);

router.get('/:id/followers', protect, getUserFollowers);
router.get('/:id/following', protect, getUserFollowing);
router.get('/:id', protect, getUserProfile);
router.put('/:id/follow', protect, followUser);

module.exports = router;