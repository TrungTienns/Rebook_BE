const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Book = require('./Book');

const Chapter = sequelize.define('Chapter', {
  id: { 
    type: DataTypes.BIGINT.UNSIGNED, 
    autoIncrement: true, 
    primaryKey: true 
  },
  bookId: { 
    type: DataTypes.BIGINT.UNSIGNED, 
    allowNull: false, 
    field: 'book_id',
    references: {
      model: Book,
      key: 'id'
    }
  },
  chapterNumber: { 
    type: DataTypes.INTEGER.UNSIGNED, 
    allowNull: false, 
    field: 'chapter_number' 
  },
  title: { 
    type: DataTypes.STRING(255), 
    allowNull: false 
  },
  content: { 
    type: DataTypes.TEXT('long'), 
    allowNull: true // Cho phép null vì có thể dùng pdfUrl thay thế
  },
  pdfUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'pdf_url'
  },
  pdfUrlEn: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'pdf_url_en'
  },
  epubUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'epub_url'
  },
  epubUrlEn: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'epub_url_en'
  },
  isVip: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: false, 
    field: 'is_vip' 
  },
  priceCoin: { 
    type: DataTypes.INTEGER.UNSIGNED, 
    defaultValue: 0, 
    field: 'price_coin' 
  },
  wordCount: { 
    type: DataTypes.INTEGER.UNSIGNED, 
    defaultValue: 0, 
    field: 'word_count' 
  },
  views: { 
    type: DataTypes.BIGINT.UNSIGNED, 
    defaultValue: 0 
  },
  status: { 
    type: DataTypes.ENUM('draft', 'published', 'hidden'), 
    defaultValue: 'published' 
  },
  publishedAt: { 
    type: DataTypes.DATE, 
    field: 'published_at' 
  }
}, {
  tableName: 'chapters',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['book_id', 'chapter_number'],
      name: 'uk_book_chapter_number'
    }
  ]
});

// Thiết lập quan hệ
Book.hasMany(Chapter, { foreignKey: 'bookId', as: 'chapters' });
Chapter.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

module.exports = Chapter;
