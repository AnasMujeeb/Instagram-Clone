const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { createReel, getReels, likeReel, addReelComment, toggleSaveReel, getSavedReelIds, getSavedReels, deleteReel, deleteReelComment, updateReelComment } = require('../controllers/reelController');

router.post('/', protect, upload.single('video'), createReel);
router.get('/saved-ids', protect, getSavedReelIds);
router.get('/saved', protect, getSavedReels);
router.get('/', protect, getReels);
router.post('/save/:id', protect, toggleSaveReel);
router.put('/like/:id', protect, likeReel);
router.post('/:id/comment', protect, addReelComment);
router.delete('/:id/comment/:commentId', protect, deleteReelComment);
router.put('/:id/comment/:commentId', protect, updateReelComment);
router.delete('/:id', protect, deleteReel);

module.exports = router;