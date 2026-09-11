const Book = require('../models/Book');
const Author = require('../models/Author');
const Category = require('../models/Category');
const Chapter = require('../models/Chapter');
const slugify = require('slugify');

const getAllBooks = async (req, res) => {
  try {
    const books = await Book.findAll({
      include: [
        { model: Author, as: 'author', attributes: ['id', 'penName'] },
        { model: Category, as: 'categories', attributes: ['id', 'name'], through: { attributes: [] } }
      ]
    });
    res.json({ success: true, data: books });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const createBook = async (req, res) => {
  try {
    let { title, slug, description, categoryId, authorName } = req.body;
    
    // 1. Tự động tạo slug nếu không có
    if (!slug) {
      slug = slugify(title, { lower: true, strict: true }) + '-' + Date.now();
    }

    // 2. Xử lý Tác Giả (nhập vào dạng text authorName)
    let finalAuthorId = 1; // Default
    if (authorName && authorName.trim() !== '') {
      const [author] = await Author.findOrCreate({
        where: { penName: authorName.trim() },
        defaults: { slug: slugify(authorName, { lower: true, strict: true }) }
      });
      finalAuthorId = author.id;
    } else {
      const defaultAuthor = await Author.findOrCreate({
        where: { id: 1 },
        defaults: { penName: 'Anonymous', slug: 'anonymous' }
      });
      finalAuthorId = defaultAuthor[0].id;
    }

    let coverImageUrl = null;
    if (req.file) {
      coverImageUrl = req.file.path; // Cloudinary URL
    }

    const book = await Book.create({ 
      title, 
      slug, 
      authorId: finalAuthorId, 
      description,
      coverImageUrl
    });

    // 3. Liên kết với Category (nếu có)
    if (categoryId) {
      // Dùng hàm addCategory do belongsToMany cung cấp
      await book.addCategory(categoryId);
    }
    
    res.status(201).json({ success: true, data: book });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo sách' });
  }
};

const getBookBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const book = await Book.findOne({
      where: { slug },
      include: [
        { model: Author, as: 'author', attributes: ['id', 'penName'] },
        { model: Category, as: 'categories', attributes: ['id', 'name'], through: { attributes: [] } },
        { model: Chapter, as: 'chapters', attributes: ['id', 'chapterNumber', 'title', 'pdfUrl'] }
      ],
      order: [
        [{ model: Chapter, as: 'chapters' }, 'chapterNumber', 'ASC']
      ]
    });

    if (!book) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách' });
    }

    res.json({ success: true, data: book });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    let { title, description, categoryId, authorName } = req.body;

    const book = await Book.findByPk(id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách' });
    }

    let updateData = { title, description };
    
    // Nếu có update Tác giả
    if (authorName && authorName.trim() !== '') {
      const [author] = await Author.findOrCreate({
        where: { penName: authorName.trim() },
        defaults: { slug: slugify(authorName, { lower: true, strict: true }) }
      });
      updateData.authorId = author.id;
    }

    // Nếu có update ảnh bìa
    if (req.file) {
      updateData.coverImageUrl = req.file.path;
    }

    await book.update(updateData);

    // Update Category nếu có
    if (categoryId) {
      // Set categories to only this one (replaces existing associations)
      await book.setCategories([categoryId]);
    }

    res.json({ success: true, message: 'Cập nhật sách thành công!', data: book });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật sách' });
  }
};

const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findByPk(id);
    
    if (!book) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách' });
    }

    // Xóa các liên kết m-n trong bảng phụ (sẽ tự động do sequelize ORM)
    await book.setCategories([]);
    
    // Nếu muốn an toàn, có thể xóa thủ công Chapter thuộc về Book
    await Chapter.destroy({ where: { bookId: id } });

    await book.destroy();

    res.json({ success: true, message: 'Xóa sách thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa sách' });
  }
};

/**
 * Tìm kiếm sách bằng FULLTEXT search
 * GET /api/v1/books/search?q=keyword
 */
const searchBooks = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.json({ success: true, data: [] });
    }

    const { sequelize } = require('../config/db');
    const { QueryTypes } = require('sequelize');

    // Sử dụng FULLTEXT search trên title và description
    const books = await sequelize.query(
      `SELECT b.*, a.pen_name as authorPenName
       FROM books b
       LEFT JOIN authors a ON b.author_id = a.id
       WHERE MATCH(b.title, b.description) AGAINST(:query IN BOOLEAN MODE)
          OR b.title LIKE :likeQuery
       ORDER BY MATCH(b.title, b.description) AGAINST(:query IN BOOLEAN MODE) DESC
       LIMIT 20`,
      {
        replacements: { query: `${q}*`, likeQuery: `%${q}%` },
        type: QueryTypes.SELECT
      }
    );

    // Map thành format tương thích với FE
    const formattedBooks = books.map(b => ({
      id: b.id,
      title: b.title,
      slug: b.slug,
      coverImageUrl: b.cover_image_url,
      description: b.description,
      status: b.status,
      totalViews: b.total_views,
      avgRating: b.avg_rating,
      author: { penName: b.authorPenName }
    }));

    res.json({ success: true, data: formattedBooks });
  } catch (error) {
    console.error('searchBooks error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tìm kiếm' });
  }
};

module.exports = { getAllBooks, createBook, getBookBySlug, updateBook, deleteBook, searchBooks };

