const express = require('express');
const router = express.Router();
const { createComment, getCommentsByBook, deleteComment, getAllCommentsAdmin, toggleCommentStatus } = require('../controllers/commentController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin: Lấy toàn bộ bình luận & Ẩn/Hiện bình luận
router.get('/admin/all', protect, admin, getAllCommentsAdmin);
router.put('/admin/:id/toggle-status', protect, admin, toggleCommentStatus);

// Public: Xem bình luận
router.get('/:bookId', getCommentsByBook);

// Protected: Tạo bình luận, xóa bình luận
router.post('/', protect, createComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;
