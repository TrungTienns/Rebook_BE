const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Book = require('./Book');
const Chapter = require('./Chapter');

const Comment = sequelize.define('Comment', {
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
  chapterId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    field: 'chapter_id',
  },
  parentId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    field: 'parent_id',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  likeCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    field: 'like_count',
  },
  status: {
    type: DataTypes.ENUM('visible', 'hidden', 'deleted'),
    defaultValue: 'visible',
  }
}, {
  tableName: 'comments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

// Associations
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Comment.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });
Comment.belongsTo(Chapter, { foreignKey: 'chapterId', as: 'chapter' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Book.hasMany(Comment, { foreignKey: 'bookId', as: 'comments' });

module.exports = Comment;
