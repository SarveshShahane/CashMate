// /server/server.js
const express = require('express');
// const mongoose = require('mongoose'); // Mongoose will be handled by connectDB
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db'); // Import connectDB
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const groupRoutes = require('./routes/groupRoutes');
const loanRoutes = require('./routes/loanRoutes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/loans', loanRoutes);


// mongoose.connect(process.env.MONGO_URI)
//   .then(() => {
//     app.listen(process.env.PORT || 5000, () => {
//       console.log('Server running on port', process.env.PORT || 5000);
//     });
//   })
//   .catch((err) => console.error('DB error:', err));

const startServer = async () => {
  try {
    await connectDB(); // Connect to MongoDB
    app.listen(process.env.PORT || 5000, () => {
      console.log('Server running on port', process.env.PORT || 5000);
    });
  } catch (err) {
    console.error('Failed to connect to DB or start server:', err);
    process.exit(1);
  }
};

startServer();
