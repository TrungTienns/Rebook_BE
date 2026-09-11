const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getAllUsers,
  updateUserRole,
  updateUserStatus
} = require('../controllers/userController');

// All user routes require admin access
router.use(protect, admin);

router.get('/', getAllUsers);
router.put('/:id/role', updateUserRole);
router.put('/:id/status', updateUserStatus);

module.exports = router;
