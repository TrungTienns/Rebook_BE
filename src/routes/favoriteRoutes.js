const express = require('express');
const router = express.Router();
const { toggleFavorite, checkFavorite, getFavorites } = require('../controllers/favoriteController');
const { protect } = require('../middleware/authMiddleware');

// Tất cả routes đều yêu cầu đăng nhập
router.use(protect);

router.get('/', getFavorites);
router.post('/', toggleFavorite);
router.get('/check/:bookId', checkFavorite);

module.exports = router;
