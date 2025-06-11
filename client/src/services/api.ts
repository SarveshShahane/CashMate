import axios, { AxiosResponse } from 'axios';
import { AuthResponse, User, Transaction, Group, Expense, Loan } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://cashmate-6557.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (name: string, email: string, password: string): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/users/register', { name, email, password }),
  
  login: (email: string, password: string): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/users/login', { email, password }),
  
  getCurrentUser: (): Promise<AxiosResponse<{ user: User }>> =>
    api.get('/users/me'),
  
  searchUser: (email: string): Promise<AxiosResponse<{ user: User }>> =>
    api.get(`/users/search?email=${encodeURIComponent(email)}`),
};

// Transaction API
export const transactionApi = {
  create: (amount: number, recipientId: string, description?: string): Promise<AxiosResponse<{ message: string; transaction: Transaction }>> =>
    api.post('/transactions/create', { amount, recipientId, description }),
  
  getAll: (): Promise<AxiosResponse<{ transactions: Transaction[] }>> =>
    api.get('/transactions'),
  
  getWithUser: (userId: string): Promise<AxiosResponse<{ transactions: Transaction[] }>> =>
    api.get(`/transactions/user/${userId}`),
  
  getByDateRange: (startDate?: string, endDate?: string): Promise<AxiosResponse<{ transactions: Transaction[] }>> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get(`/transactions/date-range?${params.toString()}`);
  },
};

// Group API
export const groupApi = {
  create: (name: string): Promise<AxiosResponse<{ message: string; group: Group }>> =>
    api.post('/groups/create', { name }),
  
  getAll: (): Promise<AxiosResponse<{ groups: Group[] }>> =>
    api.get('/groups'),
  
  getDetails: (groupId: string): Promise<AxiosResponse<{ group: Group }>> =>
    api.get(`/groups/${groupId}`),
  
  addUser: (groupId: string, email: string): Promise<AxiosResponse<{ message: string; group: Group }>> =>
    api.post('/groups/add-user', { groupId, email }),
  
  removeUser: (groupId: string, userId: string): Promise<AxiosResponse<{ message: string; group: Group }>> =>
    api.post('/groups/remove-user', { groupId, userId }),
};

// Expense API
export const expenseApi = {
  create: (groupId: string, amount: number, description: string, splitBetween: string[]): Promise<AxiosResponse<{ message: string; expense: Expense }>> =>
    api.post('/expenses/create', { groupId, amount, description, splitBetween }),
  
  getAll: (): Promise<AxiosResponse<{ expenses: Expense[] }>> =>
    api.get('/expenses'),
  
  getByGroup: (groupId: string): Promise<AxiosResponse<{ expenses: Expense[] }>> =>
    api.get(`/expenses/group/${groupId}`),
};

// Loan API
export const loanApi = {
  create: (borrower: string, amount: number, reason?: string): Promise<AxiosResponse<{ message: string; loan: Loan }>> =>
    api.post('/loans/create', { borrower, amount, reason }),
  
  getAll: (): Promise<AxiosResponse<{ loans: Loan[] }>> =>
    api.get('/loans'),
  
  settle: (loanId: string): Promise<AxiosResponse<{ message: string; loan: Loan }>> =>
    api.put(`/loans/settle/${loanId}`),
};