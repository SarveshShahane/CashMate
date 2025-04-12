const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
  createLoan,
  getMyLoans,
  settleLoan
} = require('../controllers/loanController');

router.post('/create', protect, createLoan);
router.get('/', protect, getMyLoans);
router.put('/settle/:loanId', protect, settleLoan);

module.exports = router;
