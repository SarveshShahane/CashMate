const Loan = require('../models/Loan');
const User = require('../models/User'); // Import User model at the top

exports.createLoan = async (req, res) => {
  const { borrower, amount, reason } = req.body;

  try {
    const lender = req.user._id; 
    
    if (!borrower) {
      return res.status(400).json({ message: 'Borrower ID is required' });
    }
    
    // Check if borrower exists in the database
    const borrowerExists = await User.findById(borrower); // Use the imported User model
    if (!borrowerExists) {
      return res.status(404).json({ message: 'Borrower not found' });
    }
    

    if (borrower.toString() === lender.toString()) {
      return res.status(400).json({ message: 'Cannot create a loan to yourself' });
    }

    const loan = new Loan({
      lender,
      borrower,
      amount,
      reason
    });

    await loan.save();
    res.status(201).json({ message: 'Loan created successfully', loan });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create loan', error: err.message });
  }
};
  

exports.getMyLoans = async (req, res) => {
  const userId = req.user._id;

  try {
    const loans = await Loan.find({
      $or: [{ lender: userId }, { borrower: userId }],
      // Don't filter by status: 'pending' here - get all loans including settled ones
    })
      .populate('lender', 'name email')
      .populate('borrower', 'name email')
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    // Return an array of loans directly
    res.json({ loans }); // Wrap in a 'loans' object for consistency
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch loans', error: err.message });
  }
};

  exports.settleLoan = async (req, res) => {
    const { loanId } = req.params;
    const currentUserId = req.user._id;
  
    try {
      const loanToSettle = await Loan.findById(loanId);

      if (!loanToSettle) {
        return res.status(404).json({ message: 'Loan not found' });
      }

      // Authorization: Check if the current user is the lender or the borrower
      if (!loanToSettle.lender.equals(currentUserId) && !loanToSettle.borrower.equals(currentUserId)) {
        return res.status(403).json({ message: 'Forbidden: You are not authorized to settle this loan.' });
      }

      // If already settled, prevent re-settling (optional, but good practice)
      if (loanToSettle.status === 'settled') {
        return res.status(400).json({ message: 'Loan is already settled.' });
      }

      const loan = await Loan.findByIdAndUpdate(loanId, { status: 'settled' }, { new: true })
        .populate('lender', 'name email')
        .populate('borrower', 'name email');

      // No need to check for !loan again here as findByIdAndUpdate would return null if not found,
      // but we already checked with loanToSettle.
      // However, keeping it doesn't harm.
      if (!loan) {
        // This case should ideally not be reached if loanToSettle was found
        return res.status(404).json({ message: 'Loan not found during update (should not happen).' });
      }
      res.json({ message: 'Loan settled successfully', loan });
    } catch (err) {
      res.status(500).json({ message: 'Failed to settle loan', error: err.message });
    }
  };

