const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');  // Protect middleware

const {
  createExpense,
  getGroupExpenses,
  getAllExpenses
} = require('../controllers/expenseController');

// Create expense for a group
router.post('/create', protect, createExpense);  // This is what the client is looking for

// Get all expenses
router.get('/', protect, getAllExpenses);
router.get('/all', protect, getAllExpenses);  // For backward compatibility

// Get group expenses
router.get('/group/:groupId', protect, getGroupExpenses);

module.exports = router;