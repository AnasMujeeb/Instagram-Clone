const express = require('express');
const router = express.Router();
const { createPost, getPosts, likePost, addComment, deletePost, getTimelinePosts, updatePost, deleteComment, updateComment } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
router.route('/').get(getPosts).post(protect, upload.single('image'), createPost);
router.route('/timeline').get(protect, getTimelinePosts);
router.route('/:id/like').put(protect, likePost);
router.route('/:id/comment').post(protect, addComment);
router.route('/:id/comment/:commentId').delete(protect, deleteComment).put(protect, updateComment);
router.route('/:id').put(protect, updatePost).delete(protect, deletePost);

module.exports = router;