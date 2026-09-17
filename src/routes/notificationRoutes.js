const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/authMiddleware');

// User routes
router.get('/', protect, notificationController.getMyNotifications);
router.put('/read-all', protect, notificationController.markAllAsRead);
router.put('/:id/read', protect, notificationController.markAsRead);
router.delete('/:id', protect, notificationController.deleteNotification);

// Admin routes
router.get('/admin/all', protect, admin, notificationController.getAllNotificationsGrouped);
router.delete('/admin/group', protect, admin, notificationController.deleteNotificationGroup);
router.post('/', protect, admin, notificationController.createNotification);

module.exports = router;
