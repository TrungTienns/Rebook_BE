const ReadingHistory = require('../models/ReadingHistory');
const Book = require('../models/Book');
const Chapter = require('../models/Chapter');
const Author = require('../models/Author');
const Category = require('../models/Category');

/**
 * Cập nhật lịch sử đọc (gọi khi user mở đọc 1 chương)
 * POST /api/v1/reading-history
 * Body: { bookId, chapterId }
 * Auth: Required
 */
const updateReadingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId, chapterId } = req.body;

    if (!bookId) {
      return res.status(400).json({ success: false, message: 'bookId là bắt buộc' });
    }

    // Upsert: tạo mới nếu chưa có, cập nhật nếu đã có
    const [record, created] = await ReadingHistory.findOrCreate({
      where: { userId, bookId },
      defaults: { lastChapterId: chapterId || null, lastReadAt: new Date() }
    });

    if (!created) {
      // Đã tồn tại -> cập nhật
      await record.update({
        lastChapterId: chapterId || record.lastChapterId,
        lastReadAt: new Date()
      });
    }

    // Tăng view cho sách
    await Book.increment('totalViews', { by: 1, where: { id: bookId } });

    // Tăng view cho chương (nếu có)
    if (chapterId) {
      await Chapter.increment('views', { by: 1, where: { id: chapterId } });
    }

    res.json({ success: true, data: record, message: created ? 'Đã tạo lịch sử đọc' : 'Đã cập nhật tiến độ' });
  } catch (error) {
    console.error('updateReadingHistory error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

/**
 * Lấy lịch sử đọc của user (kèm thông tin sách + chương cuối)
 * GET /api/v1/reading-history
 * Auth: Required
 */
const getReadingHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await ReadingHistory.findAll({
      where: { userId },
      include: [
        {
          model: Book,
          as: 'book',
          include: [
            { model: Author, as: 'author', attributes: ['id', 'penName'] },
            { model: Category, as: 'categories', attributes: ['id', 'name'], through: { attributes: [] } }
          ]
        },
        {
          model: Chapter,
          as: 'lastChapter',
          attributes: ['id', 'chapterNumber', 'title']
        }
      ],
      order: [['last_read_at', 'DESC']]
    });

    res.json({ success: true, data: history });
  } catch (error) {
    console.error('getReadingHistory error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { updateReadingHistory, getReadingHistory };
