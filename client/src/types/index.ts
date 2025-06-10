export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Transaction {
  _id: string;
  sender: User;
  receiver: User;
  amount: number;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  _id: string;
  groupName: string;
  members: User[];
  createdAt: string;
  updatedAt: string;
}

export interface SplitDetail {
  user: User;
  share: number;
}

export interface Expense {
  _id: string;
  group: Group;
  amount: number;
  description: string;
  splitDetails: SplitDetail[];
  createdBy: User;
  paidBy?: {
    _id: string;
    name: string;
  };
  date?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  _id: string;
  lender: User;
  borrower: User;
  amount: number;
  reason?: string;
  status: 'pending' | 'settled';
  createdAt: string;
}

export interface ApiError {
  message: string;
  error?: string;
}