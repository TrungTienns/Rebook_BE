const Book = require('../models/Book');
const User = require('../models/User');
const Author = require('../models/Author');

const getDashboardStats = async (req, res) => {
  try {
    const totalBooks = await Book.count();
    const totalUsers = await User.count();
    const activeAuthors = await Author.count();
    
    // Simulate Daily Revenue for now since there is no transaction model
    const dailyRevenue = 345;

    res.json({
      success: true,
      data: {
        totalBooks,
        totalUsers,
        activeAuthors,
        dailyRevenue
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = {
  getDashboardStats
};
