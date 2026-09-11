const express = require('express');
const router = express.Router();
const { createOrUpdateRating, getRatingsByBook, getUserRating } = require('../controllers/ratingController');
const { protect } = require('../middleware/authMiddleware');

// Public: Xem đánh giá
router.get('/:bookId', getRatingsByBook);

// Protected: Tạo/sửa đánh giá, xem đánh giá của mình
router.post('/', protect, createOrUpdateRating);
router.get('/:bookId/my', protect, getUserRating);

module.exports = router;
