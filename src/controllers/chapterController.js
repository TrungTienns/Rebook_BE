const Chapter = require('../models/Chapter');
const Book = require('../models/Book');
const fs = require('fs');
const path = require('path');
const { compressPdf } = require('pdfpressor');
const { cloudinary } = require('../config/cloudinary');
const { Op } = require('sequelize');

/**
 * Extract publicId from Cloudinary URL
 */
const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    const parts = url.split('/');
    const uploadIndex = parts.findIndex(p => p === 'upload');
    if (uploadIndex === -1) return null;
    const publicIdWithExtension = parts.slice(uploadIndex + 2).join('/');
    const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
    return publicId;
  } catch (err) {
    console.error('Error extracting publicId:', err);
    return null;
  }
};

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

    // Hàm xử lý nén và upload file lên Cloudinary
    const processPdfUpload = async (file) => {
      const originalPath = file.path;
      const compressedPath = originalPath + '_compressed.pdf';
      let finalCloudinaryUrl = null;

      try {
        console.log(`Starting compression for ${file.originalname}...`);
        try {
          // Nén file (DPI 50, quality 30 để nén cực mạnh cho các file > 30MB)
          await compressPdf(originalPath, compressedPath, 50, 30, true);
          console.log(`Compression finished for ${file.originalname}`);
          
          // Upload file nén lên Cloudinary
          const result = await cloudinary.uploader.upload(compressedPath, {
            folder: 'rebook_pdfs',
            resource_type: 'raw'
          });
          finalCloudinaryUrl = result.secure_url;
        } catch (compressErr) {
          console.error('Lỗi khi nén PDF:', compressErr);
          throw new Error('Nén PDF thất bại, file quá lớn hoặc bị lỗi. Xin thử lại với file nhỏ hơn.');
        }
      } catch (err) {
        console.error('Lỗi upload:', err);
        throw new Error('Lỗi khi tải file PDF lên hệ thống: ' + err.message);
      } finally {
        // Dọn dẹp file tạm
        if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
        if (fs.existsSync(compressedPath)) fs.unlinkSync(compressedPath);
      }
      
      return finalCloudinaryUrl;
    };

    // Hàm xử lý upload file EPUB lên Cloudinary (Không nén)
    const processEpubUpload = async (file) => {
      const originalPath = file.path;
      const newPath = originalPath + '.epub';
      fs.renameSync(originalPath, newPath);
      let finalCloudinaryUrl = null;

      try {
        console.log(`Starting EPUB upload for ${file.originalname}...`);
        const result = await cloudinary.uploader.upload(newPath, {
          folder: 'rebook_epubs',
          resource_type: 'raw'
        });
        finalCloudinaryUrl = result.secure_url;
      } catch (err) {
        console.error('Lỗi upload EPUB:', err);
        throw new Error('Lỗi khi tải file EPUB lên hệ thống: ' + err.message);
      } finally {
        // Dọn dẹp file tạm
        if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
      }
      
      return finalCloudinaryUrl;
    };

    // Xử lý upload đa file (Tiếng Việt và Tiếng Anh, PDF và EPUB)
    let pdfUrl = null;
    let pdfUrlEn = null;
    let epubUrl = null;
    let epubUrlEn = null;

    if (req.files) {
      if (req.files['file_pdf'] && req.files['file_pdf'].length > 0) {
        pdfUrl = await processPdfUpload(req.files['file_pdf'][0]);
      }
      if (req.files['file_pdf_en'] && req.files['file_pdf_en'].length > 0) {
        pdfUrlEn = await processPdfUpload(req.files['file_pdf_en'][0]);
      }
      if (req.files['file_epub'] && req.files['file_epub'].length > 0) {
        epubUrl = await processEpubUpload(req.files['file_epub'][0]);
      }
      if (req.files['file_epub_en'] && req.files['file_epub_en'].length > 0) {
        epubUrlEn = await processEpubUpload(req.files['file_epub_en'][0]);
      }
    }

    // Tạo chương mới trong DB
    const chapter = await Chapter.create({
      bookId,
      chapterNumber: finalChapterNumber,
      title,
      content: content || ' ', 
      pdfUrl,
      pdfUrlEn,
      epubUrl,
      epubUrlEn,
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

/**
 * Get all chapters (Admin)
 */
const getAllChapters = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sort = 'desc', bookId } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    // Tìm kiếm theo tên chương
    if (search) {
      whereClause.title = { [Op.like]: `%${search}%` };
    }
    
    // Lọc theo Book
    if (bookId) {
      whereClause.bookId = bookId;
    }

    const { count, rows } = await Chapter.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Book,
          as: 'book',
          attributes: ['id', 'title', 'coverImageUrl']
        }
      ],
      order: [['created_at', sort === 'asc' ? 'ASC' : 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    res.json({
      success: true,
      data: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10)
    });
  } catch (error) {
    console.error('Error fetching all chapters:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách chương' });
  }
};

/**
 * Update Chapter
 */
const updateChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const { chapterNumber, title, content, isVip, priceCoin, status } = req.body;

    const chapter = await Chapter.findByPk(id);
    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chương' });
    }

    // Kiểm tra trùng số chương nếu đổi số chương
    if (chapterNumber && parseInt(chapterNumber, 10) !== chapter.chapterNumber) {
      const existing = await Chapter.findOne({ 
        where: { bookId: chapter.bookId, chapterNumber: parseInt(chapterNumber, 10) } 
      });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Số chương này đã tồn tại trong cuốn sách.' });
      }
    }

    const processPdfUpload = async (file) => {
      const originalPath = file.path;
      const compressedPath = originalPath + '_compressed.pdf';
      let finalCloudinaryUrl = null;
      try {
        await compressPdf(originalPath, compressedPath, 50, 30, true);
        const result = await cloudinary.uploader.upload(compressedPath, { folder: 'rebook_pdfs', resource_type: 'raw' });
        finalCloudinaryUrl = result.secure_url;
      } finally {
        if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
        if (fs.existsSync(compressedPath)) fs.unlinkSync(compressedPath);
      }
      return finalCloudinaryUrl;
    };

    const processEpubUpload = async (file) => {
      const originalPath = file.path;
      const newPath = originalPath + '.epub';
      fs.renameSync(originalPath, newPath);
      let finalCloudinaryUrl = null;
      try {
        const result = await cloudinary.uploader.upload(newPath, { folder: 'rebook_epubs', resource_type: 'raw' });
        finalCloudinaryUrl = result.secure_url;
      } finally {
        if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
      }
      return finalCloudinaryUrl;
    };

    let newPdfUrl = chapter.pdfUrl;
    let newPdfUrlEn = chapter.pdfUrlEn;
    let newEpubUrl = chapter.epubUrl;
    let newEpubUrlEn = chapter.epubUrlEn;

    if (req.files) {
      if (req.files['file_pdf'] && req.files['file_pdf'].length > 0) {
        if (chapter.pdfUrl) {
          const oldPublicId = extractPublicIdFromUrl(chapter.pdfUrl);
          if (oldPublicId) await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'raw' }).catch(console.error);
        }
        newPdfUrl = await processPdfUpload(req.files['file_pdf'][0]);
      }
      if (req.files['file_pdf_en'] && req.files['file_pdf_en'].length > 0) {
        if (chapter.pdfUrlEn) {
          const oldPublicId = extractPublicIdFromUrl(chapter.pdfUrlEn);
          if (oldPublicId) await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'raw' }).catch(console.error);
        }
        newPdfUrlEn = await processPdfUpload(req.files['file_pdf_en'][0]);
      }
      if (req.files['file_epub'] && req.files['file_epub'].length > 0) {
        if (chapter.epubUrl) {
          const oldPublicId = extractPublicIdFromUrl(chapter.epubUrl);
          if (oldPublicId) await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'raw' }).catch(console.error);
        }
        newEpubUrl = await processEpubUpload(req.files['file_epub'][0]);
      }
      if (req.files['file_epub_en'] && req.files['file_epub_en'].length > 0) {
        if (chapter.epubUrlEn) {
          const oldPublicId = extractPublicIdFromUrl(chapter.epubUrlEn);
          if (oldPublicId) await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'raw' }).catch(console.error);
        }
        newEpubUrlEn = await processEpubUpload(req.files['file_epub_en'][0]);
      }
    }

    await chapter.update({
      chapterNumber: chapterNumber ? parseInt(chapterNumber, 10) : chapter.chapterNumber,
      title: title || chapter.title,
      content: content !== undefined ? content : chapter.content,
      pdfUrl: newPdfUrl,
      pdfUrlEn: newPdfUrlEn,
      epubUrl: newEpubUrl,
      epubUrlEn: newEpubUrlEn,
      isVip: isVip !== undefined ? (isVip === 'true' || isVip === true) : chapter.isVip,
      priceCoin: priceCoin !== undefined ? parseInt(priceCoin, 10) : chapter.priceCoin,
      status: status || chapter.status,
    });

    res.json({ success: true, data: chapter });
  } catch (error) {
    console.error('Error updating chapter:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật chương' });
  }
};

/**
 * Delete Chapter
 */
const deleteChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const chapter = await Chapter.findByPk(id);
    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chương' });
    }

    // Xóa file trên Cloudinary
    if (chapter.pdfUrl) {
      const publicId = extractPublicIdFromUrl(chapter.pdfUrl);
      if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }).catch(console.error);
    }
    if (chapter.pdfUrlEn) {
      const publicIdEn = extractPublicIdFromUrl(chapter.pdfUrlEn);
      if (publicIdEn) await cloudinary.uploader.destroy(publicIdEn, { resource_type: 'raw' }).catch(console.error);
    }

    const bookId = chapter.bookId;
    await chapter.destroy();

    // Giảm số chương của sách
    const book = await Book.findByPk(bookId);
    if (book && book.totalChapters > 0) {
      await book.decrement('totalChapters', { by: 1 });
    }

    res.json({ success: true, message: 'Đã xóa chương thành công' });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa chương' });
  }
};

module.exports = {
  getChaptersByBook,
  createChapter,
  getAllChapters,
  updateChapter,
  deleteChapter
};
