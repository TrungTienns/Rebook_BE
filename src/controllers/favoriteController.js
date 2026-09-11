const Favorite = require('../models/Favorite');
const Book = require('../models/Book');
const Author = require('../models/Author');
const Category = require('../models/Category');

/**
 * Toggle favorite (thêm nếu chưa có, xóa nếu đã có)
 * POST /api/v1/favorites
 * Body: { bookId }
 * Auth: Required
 */
const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({ success: false, message: 'bookId là bắt buộc' });
    }

    // Kiểm tra sách tồn tại
    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách' });
    }

    // Toggle
    const existing = await Favorite.findOne({ where: { userId, bookId } });

    if (existing) {
      await existing.destroy();
      // Giảm tổng yêu thích
      await book.decrement('totalFavorites', { by: 1 });
      return res.json({ success: true, isFavorited: false, message: 'Đã bỏ yêu thích' });
    } else {
      await Favorite.create({ userId, bookId });
      // Tăng tổng yêu thích
      await book.increment('totalFavorites', { by: 1 });
      return res.json({ success: true, isFavorited: true, message: 'Đã thêm vào yêu thích' });
    }
  } catch (error) {
    console.error('toggleFavorite error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * Kiểm tra user đã thích sách chưa
 * GET /api/v1/favorites/check/:bookId
 * Auth: Required
 */
const checkFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.params;

    const existing = await Favorite.findOne({ where: { userId, bookId } });
    res.json({ success: true, isFavorited: !!existing });
  } catch (error) {
    console.error('checkFavorite error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * Lấy danh sách sách yêu thích của user
 * GET /api/v1/favorites
 * Auth: Required
 */
const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const favorites = await Favorite.findAll({
      where: { userId },
      include: [{
        model: Book,
        as: 'book',
        include: [
          { model: Author, as: 'author', attributes: ['id', 'penName'] },
          { model: Category, as: 'categories', attributes: ['id', 'name'], through: { attributes: [] } }
        ]
      }],
      order: [['created_at', 'DESC']]
    });

    // Trả về danh sách sách (không cần wrapper Favorite)
    const books = favorites.map(f => f.book);
    res.json({ success: true, data: books });
  } catch (error) {
    console.error('getFavorites error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { toggleFavorite, checkFavorite, getFavorites };
