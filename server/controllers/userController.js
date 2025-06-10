const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.status(201).json({ 
      token, 
      user: { 
        _id: user._id, 
        name: user.name, 
        email: user.email 
      } 
    });
  } catch (err) {
    console.error('Register error:', err); // Log the detailed error
    res.status(500).json({ message: 'Server error during registration', error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err); // Log the detailed error
    res.status(500).json({ message: 'Server error during login', error: err.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (err) {
    console.error('Get current user error:', err); // Log the detailed error
    res.status(500).json({ message: 'Server error fetching current user', error: err.message });
  }
};

exports.findUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const user = await User.findOne({ email }).select('_id name email');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (err) {
    console.error('Find user by email error:', err); // Log the detailed error
    res.status(500).json({ message: 'Server error finding user by email', error: err.message });
  }
};