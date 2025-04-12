// /server/controllers/groupController.js
const Group = require('../models/Group');
const User = require('../models/User');

// Get all groups for the logged-in user
exports.getAllGroups = async (req, res) => {
  try {
    // Get groups where the user is a member
    const groups = await Group.find({
      members: req.user.id
    }).populate('members', 'name email');

    res.json({
      success: true,
      count: groups.length,
      groups
    });
  } catch (err) {
    console.error('Error getting all groups:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error getting groups' 
    });
  }
};

// Create a New Group
exports.createGroup = async (req, res) => {
  const { name } = req.body;
  const userId = req.user.id;

  try {
    const group = new Group({
      groupName: name,
      members: [userId], // Add the creator as first member
    });

    const savedGroup = await group.save();
    
    // Populate members details before sending response
    const populatedGroup = await Group.findById(savedGroup._id)
      .populate('members', 'name email');

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group: populatedGroup,
    });
  } catch (err) {
    console.error('Error creating group:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create group' 
    });
  }
};

// Add User to Group
exports.addUserToGroup = async (req, res) => {
  const { groupId, email } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found with that email' 
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ 
        success: false,
        message: 'Group not found' 
      });
    }

    // Check if user is already in the group
    if (group.members.includes(user._id)) {
      return res.status(400).json({ 
        success: false,
        message: 'User already in the group' 
      });
    }

    group.members.push(user._id);
    await group.save();

    // Populate members details before sending response
    const updatedGroup = await Group.findById(group._id)
      .populate('members', 'name email');
    
    res.json({
      success: true,
      message: 'User added to the group successfully',
      group: updatedGroup,
    });
  } catch (err) {
    console.error('Error adding user to group:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error adding user to group' 
    });
  }
};

// Remove User from Group
exports.removeUserFromGroup = async (req, res) => {
  const { groupId, userId } = req.body;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ 
        success: false,
        message: 'Group not found' 
      });
    }

    if (!group.members.includes(userId)) {
      return res.status(400).json({ 
        success: false,
        message: 'User not in the group' 
      });
    }

    group.members = group.members.filter(member => member.toString() !== userId);
    await group.save();
    
    // Populate members details before sending response
    const updatedGroup = await Group.findById(group._id)
      .populate('members', 'name email');
    
    res.json({
      success: true,
      message: 'User removed from the group successfully',
      group: updatedGroup,
    });
  } catch (err) {
    console.error('Error removing user from group:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error removing user from group' 
    });
  }
};

// Get Group Details (Members & Transactions)
exports.getGroupDetails = async (req, res) => {
  const { groupId } = req.params;

  try {
    const group = await Group.findById(groupId).populate('members', 'name email');
    if (!group) {
      return res.status(404).json({ 
        success: false,
        message: 'Group not found' 
      });
    }

    res.json({
      success: true,
      group
    });
  } catch (err) {
    console.error('Error getting group details:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error retrieving group details' 
    });
  }
};