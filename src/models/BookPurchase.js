const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Book = require('./Book');

const BookPurchase = sequelize.define('BookPurchase', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'user_id' },
  bookId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, field: 'book_id' },
  pricePaid: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'price_paid' },
  purchasedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'purchased_at' }
}, {
  tableName: 'book_purchases',
  timestamps: false
});

BookPurchase.belongsTo(User, { foreignKey: 'userId', as: 'user' });
BookPurchase.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

User.hasMany(BookPurchase, { foreignKey: 'userId', as: 'bookPurchases' });
Book.hasMany(BookPurchase, { foreignKey: 'bookId', as: 'purchases' });

module.exports = BookPurchase;
