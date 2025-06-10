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

    res.json({ groups });
  } catch (err) {
    console.error('Error getting all groups:', err);
    res.status(500).json({ 
      message: 'Server error getting groups',
      error: err.message 
    });
  }
};

// Create a New Group
exports.createGroup = async (req, res) => {
  const { name } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: 'Group name is required' });
  }

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
      message: 'Group created successfully',
      group: populatedGroup,
    });
  } catch (err) {
    console.error('Error creating group:', err);
    res.status(500).json({ 
      message: 'Failed to create group',
      error: err.message 
    });
  }
};

// Add User to Group
exports.addUserToGroup = async (req, res) => {
  const { groupId, email } = req.body;
  const currentUserId = req.user.id;

  if (!groupId || !email) {
    return res.status(400).json({ message: 'Group ID and user email are required' });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found with that email' 
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ 
        message: 'Group not found' 
      });
    }

    // Check if the current user is a member of the group
    if (!group.members.some(memberId => memberId.equals(currentUserId))) {
      return res.status(403).json({ message: 'Forbidden: You are not a member of this group.' });
    }

    // Check if user to be added is already in the group
    if (group.members.some(memberId => memberId.equals(user._id))) {
      return res.status(400).json({ 
        message: 'User already in the group' 
      });
    }

    group.members.push(user._id);
    await group.save();

    // Populate members details before sending response
    const updatedGroup = await Group.findById(group._id)
      .populate('members', 'name email');
    
    res.json({
      message: 'User added to the group successfully',
      group: updatedGroup,
    });
  } catch (err) {
    console.error('Error adding user to group:', err);
    res.status(500).json({ 
      message: 'Server error adding user to group',
      error: err.message 
    });
  }
};

// Remove User from Group
exports.removeUserFromGroup = async (req, res) => {
  const { groupId, userId } = req.body; // userId is the ID of the user to be removed
  const currentUserId = req.user.id; // ID of the user making the request

  if (!groupId || !userId) {
    return res.status(400).json({ message: 'Group ID and User ID are required' });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ 
        message: 'Group not found' 
      });
    }

    // Check if the current user is a member of the group
    if (!group.members.some(memberId => memberId.equals(currentUserId))) {
      return res.status(403).json({ message: 'Forbidden: You are not a member of this group.' });
    }

    // Check if the user to be removed is actually in the group
    if (!group.members.some(memberId => memberId.equals(userId))) {
      return res.status(400).json({ 
        message: 'User not in the group' 
      });
    }

    group.members = group.members.filter(member => !member.equals(userId));
    await group.save();
    
    // Populate members details before sending response
    const updatedGroup = await Group.findById(group._id)
      .populate('members', 'name email');
    
    res.json({
      message: 'User removed from the group successfully',
      group: updatedGroup,
    });
  } catch (err) {
    console.error('Error removing user from group:', err);
    res.status(500).json({ 
      message: 'Server error removing user from group',
      error: err.message 
    });
  }
};

// Get Group Details (Members & Transactions)
exports.getGroupDetails = async (req, res) => {
  const { groupId } = req.params;
  const currentUserId = req.user.id;

  try {
    const group = await Group.findById(groupId).populate('members', 'name email');
    if (!group) {
      return res.status(404).json({ 
        message: 'Group not found' 
      });
    }

    // Check if the current user is a member of the group
    if (!group.members.some(memberId => memberId.equals(currentUserId))) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to view this group.' });
    }

    res.json({ group });
  } catch (err) {
    console.error('Error getting group details:', err);
    res.status(500).json({ 
      message: 'Server error retrieving group details',
      error: err.message 
    });
  }
};