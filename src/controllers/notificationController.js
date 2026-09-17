const Notification = require('../models/Notification');
const User = require('../models/User');

const notificationController = {
  // CREATE NOTIFICATION (Admin only)
  createNotification: async (req, res) => {
    try {
      const { title, message, type, link } = req.body;
      
      // Lấy toàn bộ userId trong hệ thống
      const users = await User.findAll({ attributes: ['id'] });
      
      const notifications = users.map(user => ({
        userId: user.id,
        title,
        message,
        type: type || 'system',
        link,
        isRead: false
      }));

      await Notification.bulkCreate(notifications);

      return res.status(201).json({
        success: true,
        message: 'Notification sent to all users successfully',
        data: { sentCount: notifications.length }
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },


  // DELETE MY NOTIFICATION (User)
  deleteNotification: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOne({ where: { id, userId } });
      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      await notification.destroy();
      return res.status(200).json({ success: true, message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },


  // GET MY NOTIFICATIONS (User)
  getMyNotifications: async (req, res) => {
    try {
      const userId = req.user.id;
      const notifications = await Notification.findAll({
        where: { userId },
        order: [['created_at', 'DESC']],
        limit: 50 // Limit to latest 50
      });

      return res.status(200).json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },


  // MARK AS READ (User)
  markAsRead: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const notification = await Notification.findOne({
        where: { id, userId }
      });

      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      notification.isRead = true;
      await notification.save();

      return res.status(200).json({ success: true, data: notification });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },


  // MARK ALL AS READ (User)
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user.id;
      
      await Notification.update(
        { isRead: true },
        { where: { userId, isRead: false } }
      );

      return res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },


  // GET ALL NOTIFICATIONS GROUPED (Admin)
  getAllNotificationsGrouped: async (req, res) => {
    try {
      const notifications = await Notification.findAll({
        attributes: [
          'title', 
          'message', 
          'type', 
          'link', 
          'created_at',
          [Notification.sequelize.fn('COUNT', Notification.sequelize.col('id')), 'sentCount']
        ],
        group: ['title', 'message', 'type', 'link', 'created_at'],
        order: [['created_at', 'DESC']]
      });

      return res.status(200).json({ success: true, data: notifications });
    } catch (error) {
      console.error('Error fetching grouped notifications:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },


  // DELETE NOTIFICATION GROUP (Admin)
  deleteNotificationGroup: async (req, res) => {
    try {
      const { title, message, created_at } = req.body;
      if (!title || !message || !created_at) {
        return res.status(400).json({ success: false, message: 'Missing parameters' });
      }

      await Notification.destroy({
        where: { title, message, created_at }
      });

      return res.status(200).json({ success: true, message: 'Notification group deleted' });
    } catch (error) {
      console.error('Error deleting notification group:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

module.exports = notificationController;
