const Expense = require('../models/Expense');
const Group = require('../models/Group');
const User = require('../models/User');

// Create a new expense
exports.createExpense = async (req, res) => {
  try {
    
    // Extract parameters from request body
    const { groupId, amount, description, splitBetween } = req.body;

    if (!groupId || !amount || !description || !splitBetween || !Array.isArray(splitBetween)) {
      
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Get the group using ID instead of name
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
   

    // Create splitDetails array from splitBetween
    const splitDetails = [];
    const share = amount / splitBetween.length; // Equal split
    
    for (const userId of splitBetween) {
      splitDetails.push({
        user: userId,
        share: share
      });
    }

    // Create expense
    const expense = new Expense({
      group: groupId,
      amount,
      description,
      splitDetails: splitDetails,
      createdBy: req.user._id,
      // Add paid by info
      paidBy: {
        _id: req.user._id,
        name: req.user.name
      },
      // Add date
      date: new Date()
    });

    console.log('Creating expense:', expense);
    const savedExpense = await expense.save();
    console.log('Saved expense:', savedExpense);
    
    res.status(201).json(savedExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all expenses for the logged-in user
exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ 'splitDetails.user': req.user._id })
      .populate('group', 'groupName')
      .populate('splitDetails.user', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Format expenses to include proper paidBy if missing
    const formattedExpenses = expenses.map(expense => {
      const expObj = expense.toObject();
      
      // If paidBy is missing, use createdBy
      if (!expObj.paidBy || !expObj.paidBy.name) {
        expObj.paidBy = {
          _id: expense.createdBy ? expense.createdBy._id : req.user._id,
          name: expense.createdBy ? expense.createdBy.name : 'You'
        };
      }
      
      // Ensure date is present
      if (!expObj.date) {
        expObj.date = expense.createdAt;
      }
      
      return expObj;
    });

    res.json(formattedExpenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all expenses for a group (by group ID)
exports.getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const expenses = await Expense.find({ group: groupId })
      .populate('splitDetails.user', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};