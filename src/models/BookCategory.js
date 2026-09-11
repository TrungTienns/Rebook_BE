const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BookCategory = sequelize.define('BookCategory', {
  bookId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    field: 'book_id',
    primaryKey: true,
  },
  categoryId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'category_id',
    primaryKey: true,
  }
}, {
  tableName: 'book_categories',
  timestamps: false,
});

module.exports = BookCategory;
