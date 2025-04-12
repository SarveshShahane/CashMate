const Loan = require('../models/Loan');
exports.createLoan = async (req, res) => {
  const { borrower, amount, reason } = req.body;

  try {
    const lender = req.user._id; // Current authenticated user is the lender
    
    // Make sure borrower ID is provided
    if (!borrower) {
      return res.status(400).json({ message: 'Borrower ID is required' });
    }
    
    // Check if borrower exists in the database
    const borrowerExists = await require('../models/User').findById(borrower);
    if (!borrowerExists) {
      return res.status(404).json({ message: 'Borrower not found' });
    }
    
    // Prevent creating a loan to yourself
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
    res.status(201).json({ message: 'Loan created', loan });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create loan', error: err.message });
  }
};
  

// Update your getMyLoans controller function on the backend
exports.getMyLoans = async (req, res) => {
  const userId = req.user._id;

  try {
    const loans = await Loan.find({
      $or: [{ lender: userId }, { borrower: userId }],
      // Don't filter by status: 'pending' here - get all loans including settled ones
    })
      .populate('lender', 'name email')
      .populate('borrower', 'name email');

    // Return an array of loans directly
    res.json(loans);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch loans', error: err.message });
  }
};

  exports.settleLoan = async (req, res) => {
    const { loanId } = req.params;
  
    try {
      const loan = await Loan.findByIdAndUpdate(loanId, { status: 'settled' }, { new: true });
      res.json({ message: 'Loan settled', loan });
    } catch (err) {
      res.status(500).json({ message: 'Failed to settle loan', error: err.message });
    }
  };
  
  