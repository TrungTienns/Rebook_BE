const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const PaymentTransaction = sequelize.define('PaymentTransaction', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  userId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    field: 'user_id'
  },
  amountMoney: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'amount_money'
  },
  coinReceived: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'coin_received'
  },
  paymentMethod: {
    type: DataTypes.ENUM('momo', 'vnpay', 'banking', 'paypal', 'stripe'),
    allowNull: false,
    field: 'payment_method'
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed'),
    defaultValue: 'pending'
  },
  transactionRef: {
    type: DataTypes.STRING(150),
    allowNull: true,
    field: 'transaction_ref'
  }
}, {
  tableName: 'payment_transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

PaymentTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = PaymentTransaction;
