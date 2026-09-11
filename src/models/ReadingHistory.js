const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Book = require('./Book');
const Chapter = require('./Chapter');

const ReadingHistory = sequelize.define('ReadingHistory', {
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
  lastChapterId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    field: 'last_chapter_id',
  },
  lastReadAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'last_read_at',
  }
}, {
  tableName: 'reading_history',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'book_id'],
      name: 'uk_user_book'
    }
  ]
});

// Associations
ReadingHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ReadingHistory.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });
ReadingHistory.belongsTo(Chapter, { foreignKey: 'lastChapterId', as: 'lastChapter' });
User.hasMany(ReadingHistory, { foreignKey: 'userId', as: 'readingHistory' });

module.exports = ReadingHistory;
