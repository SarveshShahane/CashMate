import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Replace with your actual API URL

// Create axios instance with proper error handling
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detailed error information
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      console.error('API Error Request:', error.request);
    } else {
      console.error('API Error Message:', error.message);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const login = (email: string, password: string) => 
  api.post('/users/login', { email, password });

export const register = (name: string, email: string, password: string) => 
  api.post('/users/register', { name, email, password });

export const getCurrentUser = () =>
  api.get('/users/me');

// Groups API
export const createGroup = (name: string) => 
  api.post('/groups/create', { name });

export const getAllGroups = () =>
  api.get('/groups');

export const addUserToGroup = (groupId: string, email: string) => 
  api.post('/groups/add-user', { groupId, email });

export const removeUserFromGroup = (groupId: string, userId: string) => 
  api.post('/groups/remove-user', { groupId, userId });

export const getGroupDetails = (groupId: string) => 
  api.get(`/groups/${groupId}`);

// Expenses API
export const createExpense = (groupId: string, amount: number, description: string, splitBetween: string[]) => 
  api.post('/expenses/create', { groupId, amount, description, splitBetween });

export const getGroupExpenses = (groupId: string) => 
  api.get(`/expenses/group/${groupId}`);

export const getAllExpenses = () => 
  api.get('/expenses');

// First, add a function to find a user by 
// Find user by email
export const findUserByEmail = async (email) => {
  const token = localStorage.getItem('token');
  return axios.get(`${API_URL}/users/search?email=${encodeURIComponent(email)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const createLoan = (amount: number, borrowerId: string, description: string) => 
  api.post('/loans/create', { amount, borrower: borrowerId, description });
export const getMyLoans = () => 
  api.get('/loans');

export const settleLoan = (loanId: string) => 
  api.put(`/loans/settle/${loanId}`);

// Transactions API
export const createTransaction = (amount: number, recipientId: string, description: string) => 
  api.post('/transactions/create', { amount, recipientId, description });

export const getMyTransactions = () => 
  api.get('/transactions');

export const getTransactionsForUser = (userId: string) => 
  api.get(`/transactions/user/${userId}`);

export const getTransactionsByDateRange = (startDate?: string, endDate?: string) => {
  let queryString = '';
  if (startDate && endDate) {
    queryString = `?startDate=${startDate}&endDate=${endDate}`;
  } else if (startDate) {
    queryString = `?startDate=${startDate}`;
  } else if (endDate) {
    queryString = `?endDate=${endDate}`;
  }
  return api.get(`/transactions/date-range${queryString}`);
};