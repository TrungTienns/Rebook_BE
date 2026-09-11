const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  description: { type: DataTypes.STRING(500) },
  parentId: { type: DataTypes.INTEGER.UNSIGNED, field: 'parent_id' }
}, {
  tableName: 'categories',
  timestamps: false,
});

module.exports = Category;
