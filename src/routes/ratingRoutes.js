const express = require('express');
const router = express.Router();
const { createOrUpdateRating, getRatingsByBook, getUserRating, getAllRatingsAdmin, deleteRating, toggleRatingStatus } = require('../controllers/ratingController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin: Quản lý đánh giá
router.get('/admin/all', protect, admin, getAllRatingsAdmin);
router.delete('/admin/:id', protect, admin, deleteRating);
router.put('/admin/:id/toggle-status', protect, admin, toggleRatingStatus);

// Public: Xem đánh giá
router.get('/:bookId', getRatingsByBook);

// Protected: Tạo/sửa đánh giá, xem đánh giá của mình
router.post('/', protect, createOrUpdateRating);
router.get('/:bookId/my', protect, getUserRating);

module.exports = router;
