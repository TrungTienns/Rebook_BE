const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: 'password_hash' },
  fullName: { type: DataTypes.STRING(150), field: 'full_name' },
  avatarUrl: { type: DataTypes.STRING(500), field: 'avatar_url' },
  bio: { type: DataTypes.TEXT },
  role: { type: DataTypes.ENUM('reader', 'author', 'moderator', 'admin'), defaultValue: 'reader' },
  status: { type: DataTypes.ENUM('active', 'banned', 'pending'), defaultValue: 'active' },
  coinBalance: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0, field: 'coin_balance' }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = User;
