const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const bookRoutes = require('./bookRoutes');
const chapterRoutes = require('./chapterRoutes');
const categoryRoutes = require('./categoryRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const readingHistoryRoutes = require('./readingHistoryRoutes');
const ratingRoutes = require('./ratingRoutes');
const commentRoutes = require('./commentRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const notificationRoutes = require('./notificationRoutes');

// Auth routes
router.use('/auth', authRoutes);

// Book routes
router.use('/books', bookRoutes);

// Chapter routes
router.use('/chapters', chapterRoutes);

// Category routes
router.use('/categories', categoryRoutes);

// Favorite routes
router.use('/favorites', favoriteRoutes);

// Reading History routes
router.use('/reading-history', readingHistoryRoutes);

// Rating routes
router.use('/ratings', ratingRoutes);

// Comment routes
router.use('/comments', commentRoutes);

// User routes
const userRoutes = require('./userRoutes');
router.use('/users', userRoutes);

// Dashboard routes
router.use('/dashboard', dashboardRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);

module.exports = router;

