const express = require('express');
const router = express.Router();
const { createComment, getCommentsByBook, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

// Public: Xem bình luận
router.get('/:bookId', getCommentsByBook);

// Protected: Tạo bình luận, xóa bình luận
router.post('/', protect, createComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;
