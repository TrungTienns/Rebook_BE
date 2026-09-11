const express = require('express');
const router = express.Router();
const { updateReadingHistory, getReadingHistory } = require('../controllers/readingHistoryController');
const { protect } = require('../middleware/authMiddleware');

// Tất cả routes đều yêu cầu đăng nhập
router.use(protect);

router.get('/', getReadingHistory);
router.post('/', updateReadingHistory);

module.exports = router;
