const express = require('express');
const router = express.Router();
const {
  getPackages, createOrder, paymentCallback,
  getHistory, purchaseChapter, getPurchasedChapters, getCoinBalance, purchaseBook, getPurchasedBooks
} = require('../controllers/paymentController');
const {
  getRevenueStats, getAllTransactions, getAllPurchases, getAllBookPurchases
} = require('../controllers/adminPaymentController');
const { protect, admin } = require('../middleware/authMiddleware');

// ── User routes ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /payments/packages:
 *   get:
 *     summary: Get available coin packages
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: List of coin packages
 */
router.get('/packages', getPackages);

/**
 * @swagger
 * /payments/coin-balance:
 *   get:
 *     summary: Get current user's coin balance
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/coin-balance', protect, getCoinBalance);

/**
 * @swagger
 * /payments/history:
 *   get:
 *     summary: Get user's transaction history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/history', protect, getHistory);

/**
 * @swagger
 * /payments/purchased-chapters:
 *   get:
 *     summary: Get all chapters purchased by the user
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/purchased-chapters', protect, getPurchasedChapters);

/**
 * @swagger
 * /payments/create-order:
 *   post:
 *     summary: Create a coin top-up order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/create-order', protect, createOrder);

/**
 * @swagger
 * /payments/callback:
 *   post:
 *     summary: Process payment callback (sandbox mode)
 *     tags: [Payments]
 */
router.post('/callback', paymentCallback);

/**
 * @swagger
 * /payments/purchase-chapter:
 *   post:
 *     summary: Purchase a VIP chapter using coins
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/purchase-chapter', protect, purchaseChapter);
router.post('/purchase-book', protect, purchaseBook);
router.get('/purchased-books', protect, getPurchasedBooks);

// ── Admin routes ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /payments/admin/revenue-stats:
 *   get:
 *     summary: Get revenue overview and daily breakdown (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/revenue-stats', protect, admin, getRevenueStats);

/**
 * @swagger
 * /payments/admin/transactions:
 *   get:
 *     summary: Get all payment transactions (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/transactions', protect, admin, getAllTransactions);

/**
 * @swagger
 * /payments/admin/purchases:
 *   get:
 *     summary: Get all chapter purchases (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/purchases', protect, admin, getAllPurchases);
router.get('/admin/book-purchases', protect, admin, getAllBookPurchases);

module.exports = router;
