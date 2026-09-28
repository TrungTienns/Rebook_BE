const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Chapter = require('../models/Chapter');
const PaymentTransaction = require('../models/PaymentTransaction');
const ChapterPurchase = require('../models/ChapterPurchase');
const Book = require('../models/Book');

// ── Coin packages ─────────────────────────────────────────────────────────────
const COIN_PACKAGES = [
  {
    id: 'pkg_basic',
    name: 'Gói Cơ Bản',
    amountMoney: 50000,
    coinReceived: 100,
    badge: null,
    color: '#f0f0f0'
  },
  {
    id: 'pkg_plus',
    name: 'Gói Plus',
    amountMoney: 100000,
    coinReceived: 250,
    badge: 'Phổ biến',
    color: '#fff9c4'
  },
  {
    id: 'pkg_premium',
    name: 'Gói Premium',
    amountMoney: 200000,
    coinReceived: 600,
    badge: 'Tiết kiệm nhất',
    color: '#ffd700'
  }
];

/**
 * GET /payments/packages
 * Public — list available coin packages
 */
const getPackages = (req, res) => {
  res.json({ success: true, data: COIN_PACKAGES });
};

/**
 * POST /payments/create-order
 * Auth — create a pending transaction and return mock payment URL
 * Body: { packageId, paymentMethod }
 */
const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { packageId, paymentMethod = 'vnpay' } = req.body;

    const pkg = COIN_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return res.status(400).json({ success: false, message: 'Gói nạp xu không hợp lệ' });
    }

    const transactionRef = `RBK-${uuidv4().replace(/-/g, '').toUpperCase().slice(0, 12)}`;

    // Create pending transaction
    const transaction = await PaymentTransaction.create({
      userId,
      amountMoney: pkg.amountMoney,
      coinReceived: pkg.coinReceived,
      paymentMethod,
      status: 'pending',
      transactionRef
    });

    // In sandbox mode: return a mock payment URL pointing to our own callback page
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const mockPaymentUrl = `${clientBaseUrl}/payment/mock?ref=${transactionRef}&amount=${pkg.amountMoney}&coins=${pkg.coinReceived}&package=${pkg.name}`;

    res.json({
      success: true,
      data: {
        transactionId: transaction.id,
        transactionRef,
        amountMoney: pkg.amountMoney,
        coinReceived: pkg.coinReceived,
        paymentUrl: mockPaymentUrl,
        // NOTE: In production, replace mockPaymentUrl with real VNPay/MoMo URL
        isSandbox: true
      }
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /payments/callback
 * Sandbox callback — confirm payment, credit coins to user
 * Body: { transactionRef, action: 'confirm' | 'cancel' }
 */
const paymentCallback = async (req, res) => {
  try {
    const { transactionRef, action } = req.body;

    if (!transactionRef) {
      return res.status(400).json({ success: false, message: 'Thiếu mã giao dịch' });
    }

    const transaction = await PaymentTransaction.findOne({ where: { transactionRef } });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Giao dịch đã được xử lý' });
    }

    if (action === 'cancel') {
      await transaction.update({ status: 'failed' });
      return res.json({ success: true, cancelled: true, message: 'Giao dịch đã bị hủy' });
    }

    // Confirm → credit coins
    const user = await User.findByPk(transaction.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    const newBalance = (user.coinBalance || 0) + transaction.coinReceived;
    await user.update({ coinBalance: newBalance });
    await transaction.update({ status: 'success' });

    res.json({
      success: true,
      data: {
        coinsAdded: transaction.coinReceived,
        newBalance,
        transactionRef
      },
      message: `Nạp thành công ${transaction.coinReceived} xu!`
    });
  } catch (error) {
    console.error('Error processing payment callback:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /payments/history
 * Auth — user's transaction history
 */
const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await PaymentTransaction.findAndCountAll({
      where: { userId },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: rows,
      total: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /payments/purchase-chapter
 * Auth — spend coins to unlock a VIP chapter
 * Body: { chapterId }
 */
const purchaseChapter = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chapterId } = req.body;

    if (!chapterId) {
      return res.status(400).json({ success: false, message: 'Thiếu ID chương' });
    }

    const chapter = await Chapter.findByPk(chapterId, {
      include: [{ model: Book, as: 'book', attributes: ['id', 'title'] }]
    });

    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chương' });
    }

    if (!chapter.isVip) {
      return res.status(400).json({ success: false, message: 'Chương này không phải VIP' });
    }

    // Check if already purchased
    const alreadyPurchased = await ChapterPurchase.findOne({ where: { userId, chapterId } });
    if (alreadyPurchased) {
      return res.json({ success: true, alreadyOwned: true, message: 'Bạn đã sở hữu chương này rồi' });
    }

    const user = await User.findByPk(userId);
    const price = chapter.priceCoin || 0;

    if (user.coinBalance < price) {
      return res.status(402).json({
        success: false,
        needMoreCoins: true,
        currentBalance: user.coinBalance,
        required: price,
        message: `Không đủ xu! Bạn cần ${price} xu nhưng chỉ có ${user.coinBalance} xu.`
      });
    }

    // Deduct coins and record purchase
    await user.update({ coinBalance: user.coinBalance - price });
    await ChapterPurchase.create({ userId, chapterId, pricePaid: price });

    res.json({
      success: true,
      data: {
        chapterId,
        pricePaid: price,
        newBalance: user.coinBalance - price,
        chapterTitle: chapter.title
      },
      message: `Đã mở khóa "${chapter.title}" thành công!`
    });
  } catch (error) {
    console.error('Error purchasing chapter:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /payments/purchased-chapters
 * Auth — list all chapter IDs the user has purchased
 */
const getPurchasedChapters = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.query;

    const whereClause = { userId };
    let includeClause = [{ model: Chapter, as: 'chapter', attributes: ['id', 'chapterNumber', 'title', 'bookId'] }];

    const purchases = await ChapterPurchase.findAll({
      where: whereClause,
      include: includeClause,
      order: [['purchased_at', 'DESC']]
    });

    // Filter by bookId if provided
    const filtered = bookId
      ? purchases.filter(p => p.chapter?.bookId?.toString() === bookId.toString())
      : purchases;

    const chapterIds = filtered.map(p => p.chapterId);

    res.json({ success: true, data: { chapterIds, purchases: filtered } });
  } catch (error) {
    console.error('Error fetching purchased chapters:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /payments/coin-balance
 * Auth — get current user's coin balance
 */
const getCoinBalance = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['id', 'coinBalance'] });
    if (!user) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: { coinBalance: user.coinBalance } });
  } catch (error) {
    console.error('Error fetching coin balance:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/**
 * POST /payments/purchase-book
 * Auth — spend coins to unlock a whole VIP book
 */
const purchaseBook = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.body;
    
    if (!bookId) return res.status(400).json({ success: false, message: 'Thiếu ID sách' });
    
    const Book = require('../models/Book');
    const BookPurchase = require('../models/BookPurchase');
    const User = require('../models/User');
    
    const book = await Book.findByPk(bookId);
    if (!book) return res.status(404).json({ success: false, message: 'Không tìm thấy sách' });
    if (!book.isVip) return res.status(400).json({ success: false, message: 'Sách này không phải VIP' });
    
    const alreadyPurchased = await BookPurchase.findOne({ where: { userId, bookId } });
    if (alreadyPurchased) return res.json({ success: true, alreadyOwned: true, message: 'Bạn đã sở hữu sách này rồi' });
    
    const user = await User.findByPk(userId);
    const price = book.vipPrice || 0;
    
    if (user.coinBalance < price) {
      return res.status(402).json({
        success: false,
        needMoreCoins: true,
        currentBalance: user.coinBalance,
        required: price,
        message: `Không đủ xu! Bạn cần ${price} xu nhưng chỉ có ${user.coinBalance} xu.`
      });
    }
    
    await user.update({ coinBalance: user.coinBalance - price });
    await BookPurchase.create({ userId, bookId, pricePaid: price });
    
    res.json({
      success: true,
      data: { bookId, pricePaid: price, newBalance: user.coinBalance - price, bookTitle: book.title },
      message: `Đã mở khóa sách "${book.title}" thành công!`
    });
  } catch (error) {
    console.error('Error purchasing book:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /payments/purchased-books
 * Auth — list all book IDs the user has purchased
 */
const getPurchasedBooks = async (req, res) => {
  try {
    const BookPurchase = require('../models/BookPurchase');
    const purchases = await BookPurchase.findAll({ where: { userId: req.user.id } });
    const bookIds = purchases.map(p => p.bookId);
    res.json({ success: true, data: { bookIds } });
  } catch (error) {
    console.error('Error fetching purchased books:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  purchaseBook,
  getPurchasedBooks,
  getPackages,
  createOrder,
  paymentCallback,
  getHistory,
  purchaseChapter,
  getPurchasedChapters,
  getCoinBalance
};
