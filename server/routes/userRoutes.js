const express = require('express');
const { register, login, getCurrentUser, findUserByEmail } = require('../controllers/userController');
const protect = require('../middleware/auth');
const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getCurrentUser);
router.get('/search', protect, findUserByEmail);

module.exports = router;