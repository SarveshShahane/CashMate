// controllers/transactionController.js
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Update the createTransaction function to match client expectations
exports.createTransaction = async (req, res) => {
  try {
    // Log the incoming request for debugging
    console.log('Transaction create body:', req.body);
    
    // Updated to match what client is sending
    const { amount, recipientId, description } = req.body;
    
    if (!amount || !recipientId) {
      return res.status(400).json({ message: 'Amount and recipient are required' });
    }
    
    // Find the recipient user
    const recipient = await User.findOne({ 
      $or: [
        { _id: recipientId },
        { email: recipientId }  // Support finding by email too
      ]
    });
    
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    
    // Create the transaction
    const newTransaction = new Transaction({
      sender: req.user._id,
      receiver: recipient._id,
      amount,
      description,
      date: new Date()
    });
    
    // Save the transaction
    await newTransaction.save();
    
    // Respond with the newly created transaction
    res.status(201).json({ 
      message: 'Transaction created successfully', 
      transaction: newTransaction 
    });
  } catch (err) {
    console.error('Transaction create error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update the getMyTransactions function to match the schema in client
exports.getMyTransactions = async (req, res) => {
  try {
    console.log('Getting transactions for user:', req.user._id);
    const userId = req.user._id;

    const transactions = await Transaction.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate('sender', 'name email') 
      .populate('receiver', 'name email')
      .sort({ createdAt: -1 }); // Sort by newest first

    console.log(`Found ${transactions.length} transactions`);
    
    res.status(200).json({ transactions });
  } catch (err) {
    console.error('Error getting transactions:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// 3. Get transactions with a specific user
exports.getTransactionsForUser = async (req, res) => {
  try {
    const { email } = req.params; // Get receiver's email from URL params
    const userId = req.user._id;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const transactions = await Transaction.find({
      $or: [
        { sender: userId, receiver: user._id },
        { sender: user._id, receiver: userId },
      ],
    })
      .populate('sender', 'name email')
      .populate('receiver', 'name email');

    res.status(200).json({ transactions });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// 4. Get transactions for a specific date range
exports.getTransactionsByDateRange = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    
    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else if (startDate) {
      dateFilter = {
        date: { $gte: new Date(startDate) }
      };
    } else if (endDate) {
      dateFilter = {
        date: { $lte: new Date(endDate) }
      };
    }

    const transactions = await Transaction.find({
      $or: [{ sender: userId }, { receiver: userId }],
      ...dateFilter
    })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .sort({ date: -1 }); // Sort by date descending (newest first)

    res.status(200).json({ transactions });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};