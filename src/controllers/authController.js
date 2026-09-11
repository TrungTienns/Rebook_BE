const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const admin = require('../config/firebase');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please add all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Check username
    const usernameExists = await User.findOne({ where: { username } });
    if (usernameExists) {
      return res.status(400).json({ success: false, message: 'Username is taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      passwordHash: hashedPassword,
      fullName
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          role: user.role,
          token: generateToken(user.id),
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại. Bạn hãy kiểm tra lại email nhé.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác. Bạn nhập lại thử xem sao.' });
    }

    // Success
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        token: generateToken(user.id),
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Authenticate with Firebase (Google/Facebook)
// @route   POST /api/auth/firebase
const firebaseLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'No token provided' });
    }

    // Verify token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name, picture, uid } = decodedToken;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Token does not contain email' });
    }

    // Check if user exists
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Create new user if they don't exist
      const username = `user_${uid.substring(0, 8)}_${Math.floor(Math.random() * 1000)}`;
      const randomPassword = await bcrypt.hash(uid + Date.now().toString(), 10);
      
      user = await User.create({
        username,
        email,
        passwordHash: randomPassword, // Dummy password
        fullName: name || 'User',
        avatarUrl: picture || null
      });
    } else if (!user.avatarUrl && picture) {
       // Update avatar if they didn't have one
       await user.update({ avatarUrl: picture });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        token: generateToken(user.id),
      }
    });

  } catch (error) {
    console.error(error);
    res.status(401).json({ success: false, message: 'Invalid Firebase token' });
  }
};

module.exports = {
  register,
  login,
  firebaseLogin
};
