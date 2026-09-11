const Rating = require('../models/Rating');
const Book = require('../models/Book');
const User = require('../models/User');
const { sequelize } = require('../config/db');

/**
 * Tạo hoặc cập nhật đánh giá
 * POST /api/v1/ratings
 * Body: { bookId, stars, review }
 * Auth: Required
 */
const createOrUpdateRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId, stars, review } = req.body;

    if (!bookId || !stars) {
      return res.status(400).json({ success: false, message: 'bookId và stars là bắt buộc' });
    }

    if (stars < 1 || stars > 5) {
      return res.status(400).json({ success: false, message: 'Số sao phải từ 1 đến 5' });
    }

    // Kiểm tra sách
    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách' });
    }

    // Upsert rating
    const [rating, created] = await Rating.findOrCreate({
      where: { userId, bookId },
      defaults: { stars, review: review || null }
    });

    if (!created) {
      await rating.update({ stars, review: review || rating.review });
    }

    // Tính lại avg_rating và rating_count cho sách
    const stats = await Rating.findOne({
      where: { bookId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('stars')), 'avgRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'ratingCount']
      ],
      raw: true
    });

    await book.update({
      avgRating: parseFloat(stats.avgRating || 0).toFixed(2),
      ratingCount: parseInt(stats.ratingCount || 0)
    });

    res.json({
      success: true,
      data: rating,
      message: created ? 'Đã đánh giá thành công' : 'Đã cập nhật đánh giá',
      bookStats: { avgRating: stats.avgRating, ratingCount: stats.ratingCount }
    });
  } catch (error) {
    console.error('createOrUpdateRating error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * Lấy danh sách đánh giá theo sách
 * GET /api/v1/ratings/:bookId
 */
const getRatingsByBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    const ratings = await Rating.findAll({
      where: { bookId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName', 'avatarUrl']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: ratings });
  } catch (error) {
    console.error('getRatingsByBook error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * Lấy rating hiện tại của user cho 1 sách
 * GET /api/v1/ratings/:bookId/my
 * Auth: Required
 */
const getUserRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.params;

    const rating = await Rating.findOne({ where: { userId, bookId } });
    res.json({ success: true, data: rating });
  } catch (error) {
    console.error('getUserRating error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { createOrUpdateRating, getRatingsByBook, getUserRating };
