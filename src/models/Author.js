const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Author = sequelize.define('Author', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.BIGINT.UNSIGNED, field: 'user_id' },
  penName: { type: DataTypes.STRING(150), allowNull: false, field: 'pen_name' },
  bio: { type: DataTypes.TEXT },
  avatarUrl: { type: DataTypes.STRING(500), field: 'avatar_url' },
  country: { type: DataTypes.STRING(100) }
}, {
  tableName: 'authors',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

Author.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// --- Associations added for author management feature ---
const AuthorFollow = require('./AuthorFollow');
Author.hasMany(AuthorFollow, { foreignKey: 'authorId', as: 'followers' });
Author.belongsToMany(User, {
  through: AuthorFollow,
  as: 'followerUsers',
  foreignKey: 'authorId',
  otherKey: 'userId'
});

module.exports = Author;
