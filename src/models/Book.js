const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Author = require('./Author');
const User = require('./User');

const Book = sequelize.define('Book', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  titleEn: { type: DataTypes.STRING(255), allowNull: true, field: 'title_en' },
  slug: { type: DataTypes.STRING(280), allowNull: false, unique: true },
  authorId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'author_id' },
  coverImageUrl: { type: DataTypes.STRING(500), field: 'cover_image_url' },
  description: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('ongoing', 'completed', 'paused', 'dropped'), defaultValue: 'ongoing' },
  isVip: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_vip' },
  vipPrice: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0, field: 'vip_price' },
  totalChapters: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0, field: 'total_chapters' },
  totalViews: { type: DataTypes.BIGINT.UNSIGNED, defaultValue: 0, field: 'total_views' },
  totalFavorites: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0, field: 'total_favorites' },
  avgRating: { type: DataTypes.DECIMAL(3,2), defaultValue: 0.00, field: 'avg_rating' },
  ratingCount: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0, field: 'rating_count' },
  createdBy: { type: DataTypes.BIGINT.UNSIGNED, field: 'created_by' }
}, {
  tableName: 'books',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Book.belongsTo(Author, { foreignKey: 'authorId', as: 'author' });
Book.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

const Category = require('./Category');
const BookCategory = require('./BookCategory');

Book.belongsToMany(Category, { 
  through: BookCategory, 
  as: 'categories', 
  foreignKey: 'bookId', 
  otherKey: 'categoryId' 
});

module.exports = Book;
