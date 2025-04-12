// /server/routes/groupRoutes.js
const express = require('express');
const { 
  createGroup, 
  addUserToGroup, 
  removeUserFromGroup, 
  getGroupDetails,
  getAllGroups 
} = require('../controllers/groupController');
const router = express.Router();
const protect = require('../middleware/auth');

// Protect all routes with auth middleware
router.use(protect);

// Route to get all groups for the logged-in user
router.get('/', getAllGroups);

// Other group routes
router.post('/create', createGroup);
router.post('/add-user', addUserToGroup);
router.post('/remove-user', removeUserFromGroup);
router.get('/:groupId', getGroupDetails);

module.exports = router;