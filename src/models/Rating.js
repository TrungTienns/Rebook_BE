const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Book = require('./Book');

const Rating = sequelize.define('Rating', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    field: 'user_id',
  },
  bookId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    field: 'book_id',
  },
  stars: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    }
  },
  review: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: 'ratings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'book_id'],
      name: 'uk_user_book_rating'
    }
  ]
});

// Associations
Rating.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Rating.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });
User.hasMany(Rating, { foreignKey: 'userId', as: 'ratings' });
Book.hasMany(Rating, { foreignKey: 'bookId', as: 'ratings' });

module.exports = Rating;
