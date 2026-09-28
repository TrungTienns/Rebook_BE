const Book = require('../models/Book');
const User = require('../models/User');
const Author = require('../models/Author');
const PaymentTransaction = require('../models/PaymentTransaction');
const { fn, col, Op } = require('sequelize');

const getDashboardStats = async (req, res) => {
  try {
    const totalBooks = await Book.count();
    const totalUsers = await User.count();
    const activeAuthors = await Author.count();

    // Real daily revenue from payment_transactions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [revenueResult] = await PaymentTransaction.findAll({
      where: { status: 'success', created_at: { [Op.gte]: today } },
      attributes: [[fn('SUM', col('amount_money')), 'total']],
      raw: true
    });
    const dailyRevenue = parseFloat(revenueResult?.total || 0);

    res.json({
      success: true,
      data: { totalBooks, totalUsers, activeAuthors, dailyRevenue }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = { getDashboardStats };

