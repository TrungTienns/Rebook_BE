const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = require('./User');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.ENUM('system', 'promotion', 'new_book'), defaultValue: 'system' },
  link: { type: DataTypes.STRING(500) },
  userId: { type: DataTypes.BIGINT.UNSIGNED, field: 'user_id', allowNull: false },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_read' },
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

module.exports = Notification;
