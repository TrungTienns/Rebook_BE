const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Book = require('./Book');

const Favorite = sequelize.define('Favorite', {
  userId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    field: 'user_id',
    primaryKey: true,
  },
  bookId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    field: 'book_id',
    primaryKey: true,
  }
}, {
  tableName: 'favorites',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

// Associations
Favorite.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Favorite.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });
User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' });
Book.hasMany(Favorite, { foreignKey: 'bookId', as: 'favoritedBy' });

module.exports = Favorite;
