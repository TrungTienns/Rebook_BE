const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard management APIs
 */

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get dashboard stats
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.get('/stats', getDashboardStats);

module.exports = router;
