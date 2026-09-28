const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const AuthorFollow = sequelize.define('AuthorFollow', {
  userId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    primaryKey: true,
    field: 'user_id'
  },
  authorId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    primaryKey: true,
    field: 'author_id'
  },
  followedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'followed_at'
  }
}, {
  tableName: 'author_follows',
  timestamps: false,
});

module.exports = AuthorFollow;
