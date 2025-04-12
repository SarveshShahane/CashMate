export interface User {
    _id: string;
    name: string;
    email: string;
    password: string;
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
  
  export interface Loan {
    _id: string;
    lender: User;
    borrower: User;
    amount: number;
    reason?: string;
    status: 'pending' | 'settled';
    createdAt: string;
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

  interface ExpenseState {
    _id: string;
    description: string;
    amount: number;
    group?: {
      _id: string;
      name: string;
    };
    paidBy?: {
      _id: string;
      name: string;
    };
    createdBy?: {  // Add this as an alternative to paidBy
      _id: string;
      name: string;
    };
    date?: string;  // Make date optional
    createdAt?: string;  // Add createdAt as an alternative to date
    updatedAt?: string;
    splitBetween: Array<{
      user: {
        _id: string;
        name: string;
      };
      amount?: number;  // Support both amount and share
      share?: number;
    }>;
  }