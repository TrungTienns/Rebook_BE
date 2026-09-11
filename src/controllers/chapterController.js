const Chapter = require('../models/Chapter');
const Book = require('../models/Book');

/**
 * Get all chapters for a specific book
 */
const getChaptersByBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const chapters = await Chapter.findAll({
      where: { bookId },
      order: [['chapterNumber', 'ASC']]
    });
    res.json({ success: true, data: chapters });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách chương' });
  }
};

/**
 * Create a new chapter (with optional PDF upload)
 */
const createChapter = async (req, res) => {
  try {
    const { bookId, chapterNumber, title, content, isVip, priceCoin, status } = req.body;

    // Kiểm tra xem sách có tồn tại không
    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách' });
    }

    // Tự động tính số chương tiếp theo nếu không truyền vào
    let finalChapterNumber = chapterNumber ? parseInt(chapterNumber, 10) : null;
    if (!finalChapterNumber) {
      const lastChapter = await Chapter.findOne({
        where: { bookId },
        order: [['chapterNumber', 'DESC']],
      });
      finalChapterNumber = lastChapter ? lastChapter.chapterNumber + 1 : 1;
    }

    // Kiểm tra trước xem số chương đã tồn tại chưa (tránh lỗi DB trùng lặp)
    const existing = await Chapter.findOne({ where: { bookId, chapterNumber: finalChapterNumber } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Chương số ${finalChapterNumber} đã tồn tại trong cuốn sách này. Vui lòng chọn số chương khác.`,
      });
    }

    // Nếu có file đính kèm (PDF), multer-storage-cloudinary đã tự động tải lên và lưu URL vào req.file.path
    let pdfUrl = null;
    if (req.file) {
      pdfUrl = req.file.path; // URL trực tiếp của file PDF trên Cloudinary
    }

    // Tạo chương mới trong DB
    const chapter = await Chapter.create({
      bookId,
      chapterNumber: finalChapterNumber,
      title,
      content: content || ' ', // Mặc định là khoảng trắng để tránh lỗi NOT NULL trong DB
      pdfUrl,
      isVip: isVip === 'true' || isVip === true,
      priceCoin: priceCoin || 0,
      status: status || 'published',
      publishedAt: status === 'published' ? new Date() : null
    });

    // Cập nhật lại tổng số chương của cuốn sách
    await book.increment('totalChapters', { by: 1 });

    res.status(201).json({ success: true, data: chapter });
  } catch (error) {
    console.error('Error creating chapter:', error);
    
    // Fallback: xử lý lỗi trùng lặp từ DB (phòng race condition)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        success: false, 
        message: 'Chương này đã tồn tại cho cuốn sách hiện tại (trùng số chương).' 
      });
    }

    // Xử lý lỗi validation khác
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message).join(', ');
      return res.status(400).json({ 
        success: false, 
        message: 'Dữ liệu không hợp lệ: ' + messages 
      });
    }

    res.status(500).json({ success: false, message: 'Lỗi server khi tạo chương mới: ' + error.message });
  }
};

module.exports = {
  getChaptersByBook,
  createChapter
};
