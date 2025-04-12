const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');  // Protect middleware

const {
  createTransaction,
  getMyTransactions,
  getTransactionsForUser,
  getTransactionsByDateRange
} = require('../controllers/transactionController');

// Create transaction (POST /create)
router.post('/create', protect, createTransaction);

// Add the base route to match client's call
router.get('/', protect, getMyTransactions);

// Keep existing route
router.get('/all', protect, getMyTransactions);

// Get transactions for a user
router.get('/user/:userId', protect, getTransactionsForUser);

// Get transactions by date range (GET /date-range)
router.get('/date-range', protect, getTransactionsByDateRange);

module.exports = router;