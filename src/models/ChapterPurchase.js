const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Chapter = require('./Chapter');

const ChapterPurchase = sequelize.define('ChapterPurchase', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  userId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    field: 'user_id'
  },
  chapterId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    field: 'chapter_id'
  },
  pricePaid: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'price_paid'
  },
  purchasedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'purchased_at'
  }
}, {
  tableName: 'chapter_purchases',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['user_id', 'chapter_id'], name: 'uk_user_chapter' }
  ]
});

ChapterPurchase.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ChapterPurchase.belongsTo(Chapter, { foreignKey: 'chapterId', as: 'chapter' });

module.exports = ChapterPurchase;
