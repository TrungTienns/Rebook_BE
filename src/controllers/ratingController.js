const Rating = require('../models/Rating');
const Book = require('../models/Book');
const User = require('../models/User');
const { sequelize } = require('../config/db');
const vnBadwords = require('@vnphu/vn-badwords');

const censorText = (text) => {
  if (!text) return text;
  const sortedBlackList = [...vnBadwords.blackList].sort((a, b) => b.length - a.length);
  let result = text;
  for (const badword of sortedBlackList) {
    if (!badword) continue;
    try {
      const regex = new RegExp(`(?<=^|\\s|\\W)(${badword})(?=$|\\s|\\W)`, 'gi');
      result = result.replace(regex, (match) => '*'.repeat(match.length));
    } catch (e) {}
  }
  return result;
};

// Helper to recalculate book rating stats
const recalculateBookStats = async (bookId) => {
  const Book = require('../models/Book');
  const Rating = require('../models/Rating');
  const { sequelize } = require('../config/db');

  const stats = await Rating.findOne({
    where: { bookId, status: 'visible' },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('stars')), 'avgRating'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'ratingCount']
    ],
    raw: true
  });

  const book = await Book.findByPk(bookId);
  if (book) {
    await book.update({
      avgRating: parseFloat(stats.avgRating || 0).toFixed(2),
      ratingCount: parseInt(stats.ratingCount || 0)
    });
  }
  return stats;
};

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
    const safeReview = review ? censorText(review.trim()) : null;
    const [rating, created] = await Rating.findOrCreate({
      where: { userId, bookId },
      defaults: { stars, review: safeReview }
    });

    if (!created) {
      await rating.update({ stars, review: safeReview !== null ? safeReview : rating.review });
    }

    // Tính lại avg_rating và rating_count cho sách
    const stats = await recalculateBookStats(bookId);

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
      where: { bookId, status: 'visible' },
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

/**
 * Lấy toàn bộ đánh giá (Dành cho Admin)
 * GET /api/v1/ratings/admin/all
 */
const getAllRatingsAdmin = async (req, res) => {
  try {
    const { bookId, status } = req.query;
    const whereClause = {};
    
    if (bookId) whereClause.bookId = bookId;
    if (status && status !== 'all') whereClause.status = status;

    const ratings = await Rating.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'fullName', 'avatarUrl', 'email'] },
        { model: require('../models/Book'), as: 'book', attributes: ['id', 'title'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: ratings });
  } catch (error) {
    console.error('getAllRatingsAdmin error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * Xóa vĩnh viễn đánh giá (Dành cho Admin)
 * DELETE /api/v1/ratings/admin/:id
 */
const deleteRating = async (req, res) => {
  try {
    const { id } = req.params;
    const rating = await Rating.findByPk(id);

    if (!rating) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }

    const bookId = rating.bookId;
    await rating.destroy();
    
    // Tính lại avgRating cho sách
    await recalculateBookStats(bookId);

    res.json({ success: true, message: 'Đã xóa đánh giá vĩnh viễn' });
  } catch (error) {
    console.error('deleteRating error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * Ẩn/Hiện đánh giá (Dành cho Admin)
 * PUT /api/v1/ratings/admin/:id/toggle-status
 */
const toggleRatingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const rating = await Rating.findByPk(id);

    if (!rating) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }

    const newStatus = rating.status === 'hidden' ? 'visible' : 'hidden';
    await rating.update({ status: newStatus });

    // Cập nhật lại avgRating vì rating này có thể bị loại khỏi tính toán
    await recalculateBookStats(rating.bookId);

    res.json({ success: true, message: `Đã ${newStatus === 'hidden' ? 'ẩn' : 'hiện'} đánh giá`, data: rating });
  } catch (error) {
    console.error('toggleRatingStatus error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { createOrUpdateRating, getRatingsByBook, getUserRating, getAllRatingsAdmin, deleteRating, toggleRatingStatus };
