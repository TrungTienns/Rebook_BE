const { Op, fn, col, literal } = require('sequelize');
const PaymentTransaction = require('../models/PaymentTransaction');
const ChapterPurchase = require('../models/ChapterPurchase');
const User = require('../models/User');
const Chapter = require('../models/Chapter');
const Book = require('../models/Book');

/**
 * GET /admin/payments/revenue-stats
 * Admin — revenue overview + daily breakdown
 */
const getRevenueStats = async (req, res) => {
  try {
    const { period = '7' } = req.query; // days
    const days = parseInt(period, 10);
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Totals (all-time, successful only)
    const [totalResult] = await PaymentTransaction.findAll({
      where: { status: 'success' },
      attributes: [
        [fn('SUM', col('amount_money')), 'totalRevenue'],
        [fn('SUM', col('coin_received')), 'totalCoinsIssued'],
        [fn('COUNT', col('id')), 'totalTransactions']
      ],
      raw: true
    });

    // Daily breakdown for chart
    const dailyData = await PaymentTransaction.findAll({
      where: {
        status: 'success',
        created_at: { [Op.gte]: since }
      },
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('SUM', col('amount_money')), 'revenue'],
        [fn('COUNT', col('id')), 'transactions'],
        [fn('SUM', col('coin_received')), 'coinsIssued']
      ],
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true
    });

    // Chapter purchases count (all-time)
    const totalPurchases = await ChapterPurchase.count();
    const BookPurchase = require('../models/BookPurchase');
    const totalBookPurchases = await BookPurchase.count();

    res.json({
      success: true,
      data: {
        totals: {
          totalRevenue: parseFloat(totalResult?.totalRevenue || 0),
          totalCoinsIssued: parseInt(totalResult?.totalCoinsIssued || 0),
          totalTransactions: parseInt(totalResult?.totalTransactions || 0),
          totalChapterPurchases: totalPurchases,
          totalBookPurchases: totalBookPurchases
        },
        dailyData
      }
    });
  } catch (error) {
    console.error('Error fetching revenue stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /admin/payments/transactions
 * Admin — all payment transactions with pagination and filters
 */
const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 15, status, method } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {};
    if (status) whereClause.status = status;
    if (method) whereClause.paymentMethod = method;

    const { count, rows } = await PaymentTransaction.findAndCountAll({
      where: whereClause,
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email', 'fullName'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    res.json({
      success: true,
      data: rows,
      total: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /admin/payments/purchases
 * Admin — all chapter purchases
 */
const getAllPurchases = async (req, res) => {
  try {
    const { page = 1, limit = 15 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await ChapterPurchase.findAndCountAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
        {
          model: Chapter, as: 'chapter', attributes: ['id', 'chapterNumber', 'title', 'priceCoin'],
          include: [{ model: Book, as: 'book', attributes: ['id', 'title'] }]
        }
      ],
      order: [['purchased_at', 'DESC']],
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    res.json({
      success: true,
      data: rows,
      total: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching chapter purchases:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/**
 * GET /admin/payments/book-purchases
 */
const getAllBookPurchases = async (req, res) => {
  try {
    const { page = 1, limit = 15 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const BookPurchase = require('../models/BookPurchase');
    
    const { count, rows } = await BookPurchase.findAndCountAll({
      include: [
        { model: require('../models/User'), as: 'user', attributes: ['id', 'username', 'email'] },
        { model: require('../models/Book'), as: 'book', attributes: ['id', 'title', 'vipPrice'] }
      ],
      order: [['purchased_at', 'DESC']],
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    res.json({
      success: true,
      data: rows,
      total: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching book purchases:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAllBookPurchases, getRevenueStats, getAllTransactions, getAllPurchases };
