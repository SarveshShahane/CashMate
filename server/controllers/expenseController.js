const Expense = require('../models/Expense');
const Group = require('../models/Group');
const User = require('../models/User');
const splitExpenseEqually = require('../utils/splitExpense'); // Import the utility

// Create a new expense
exports.createExpense = async (req, res) => {
  try {
    
    // Extract parameters from request body
    const { groupId, amount, description, splitBetween } = req.body;
    const currentUserId = req.user._id;

    if (!groupId || !amount || !description || !splitBetween || !Array.isArray(splitBetween) || splitBetween.length === 0) {
      
      return res.status(400).json({ message: 'All fields are required, and splitBetween must not be empty.' });
    }
    
    // Get the group using ID instead of name
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Authorization: Check if the current user (creator/payer) is a member of the group
    if (!group.members.some(memberId => memberId.equals(currentUserId))) {
      return res.status(403).json({ message: 'Forbidden: You are not a member of this group and cannot create expenses for it.' });
    }
    
    // Data Integrity: Check if all users in splitBetween are members of the group
    for (const userId of splitBetween) {
      if (!group.members.some(memberId => memberId.equals(userId))) {
        const nonMemberUser = await User.findById(userId).select('name email'); // For a more informative message
        return res.status(400).json({ 
          message: `User ${nonMemberUser ? nonMemberUser.name : userId} is not a member of this group and cannot be included in the expense split.` 
        });
      }
    }
   

    // Create splitDetails array from splitBetween using the utility function
    const splitDetails = splitExpenseEqually(amount, splitBetween);
    
    // As a sanity check, ensure the sum of splitDetails.share equals the original amount
    // This check is now primarily within the utility, but can be kept here if desired for an extra layer.
    // const sumOfShares = splitDetails.reduce((sum, detail) => sum + detail.share, 0);
    // if (parseFloat(sumOfShares.toFixed(2)) !== parseFloat(amount.toFixed(2))) {
    //     console.warn(`Controller: Sum of shares (${sumOfShares.toFixed(2)}) does not match original amount (${amount.toFixed(2)}) for expense.`);
    // }


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
    
    // Populate necessary fields for the response
    const populatedExpense = await Expense.findById(savedExpense._id)
      .populate('group', 'groupName')
      .populate('splitDetails.user', 'name email')
      .populate('createdBy', 'name email')
      .populate('paidBy._id', 'name email');

    res.status(201).json({ message: 'Expense created successfully', expense: populatedExpense });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Failed to create expense', error: error.message });
  }
};

// Get all expenses for the logged-in user
exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ 'splitDetails.user': req.user._id })
      .populate('group', 'groupName')
      .populate('splitDetails.user', 'name email')
      .populate('createdBy', 'name email')
      .populate('paidBy._id', 'name email') // Populate paidBy user details
      .sort({ date: -1 }); // Sort by expense date, newest first

    // Format expenses to include proper paidBy if missing
    const formattedExpenses = expenses.map(expense => {
      const expObj = expense.toObject();
      
      // If paidBy is missing or its name is missing, attempt to fill it
      if (!expObj.paidBy || !expObj.paidBy.name) {
        // Use createdBy details if available, otherwise fallback to current user's details
        const payerId = (expense.createdBy && expense.createdBy._id) ? expense.createdBy._id : req.user._id;
        const payerName = (expense.createdBy && expense.createdBy.name) ? expense.createdBy.name : req.user.name; // Use req.user.name as fallback

        expObj.paidBy = {
          _id: payerId,
          name: payerName
        };
      }
      
      // Ensure date is present
      if (!expObj.date) {
        expObj.date = expense.createdAt;
      }
      
      return expObj;
    });

    res.json({ expenses: formattedExpenses });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch expenses', error: error.message });
  }
};

// Get all expenses for a group (by group ID)
exports.getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;
    const currentUserId = req.user._id;

    // Fetch the group to check membership
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Authorization: Check if the current user is a member of the group
    if (!group.members.some(memberId => memberId.equals(currentUserId))) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to view expenses for this group.' });
    }
    
    const expenses = await Expense.find({ group: groupId })
      .populate('splitDetails.user', 'name email')
      .populate('createdBy', 'name email')
      .populate('paidBy._id', 'name email') // Populate paidBy user details
      .sort({ date: -1 }); // Sort by expense date, newest first

    res.json({ expenses });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch group expenses', error: error.message });
  }
};