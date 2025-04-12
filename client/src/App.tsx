import React, { useState, useEffect, useRef } from 'react';
import { Wallet, Users, Receipt, CreditCard, Menu, X, Plus, DollarSign, UserPlus, Mail, Lock, History } from 'lucide-react';
import * as api from './api';

import { User, Group, Expense, Loan, Transaction, SplitDetail } from './types.ts';
import TransactionHistory from './pages/TransactionHistory';

// Component state interfaces
interface GroupState {
  _id: string;
  groupName: string;
  members: Array<{_id: string, name: string, email: string}>;
  createdAt: string;
  updatedAt: string;
}

interface ExpenseState {
  _id: string;
  description: string;
  amount: number;
  paidBy: {
    _id: string;
    name: string;
  };
  date: string;
  splitBetween: Array<{
    user: {
      _id: string;
      name: string;
    };
    amount: number;
  }>;
}

interface LoanState {
  _id: string;
  amount: number;
  lender: {
    _id: string;
    name: string;
  };
  borrower: {
    _id: string;
    name: string;
  };
  description: string;
  settled: boolean;
  createdAt: string;
}

interface TransactionState {
  _id: string;
  amount: number;
  description?: string;
  date: string;
  sender: {
    _id: string;
    name: string;
  };
  receiver: {
    _id: string;
    name: string;
  };
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoginView, setIsLoginView] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [groups, setGroups] = useState<GroupState[]>([]);
  const [expenses, setExpenses] = useState<ExpenseState[]>([]);
  const [loansOwed, setLoansOwed] = useState<LoanState[]>([]);
  const [loansToCollect, setLoansToCollect] = useState<LoanState[]>([]);
  const [transactions, setTransactions] = useState<TransactionState[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Create modal states
  const [showGroupModal, setShowGroupModal] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [newExpense, setNewExpense] = useState({
    groupId: '',
    amount: 0,
    description: '',
    splitBetween: [] as string[]
  });
  
  const [showLoanModal, setShowLoanModal] = useState<boolean>(false);
  const [newLoan, setNewLoan] = useState({
    amount: 0,
    borrowerId: '',
    description: ''
  });
  
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  // For user ID storage
  const userIdRef = useRef<string | null>(localStorage.getItem('userId'));

  // Add this debugging function 
useEffect(() => {
  if (isAuthenticated) {
    console.log("DEBUG DATA:", {
      expenses,
      loansOwed,
      loansToCollect,
      currentUser,
      userId: userIdRef.current
    });
    
    // Calculate and log all balances for debugging
    const expensesYouOwe = expenses?.reduce((total, expense) => {
      if (expense.paidBy?._id !== userIdRef.current) {
        const userSplit = expense.splitBetween?.find(split => split.user?._id === userIdRef.current);
        const amount = userSplit ? (userSplit.amount || userSplit.share || 0) : 0;
        console.log(`You owe ${amount} for expense: ${expense.description}`);
        return total + amount;
      }
      return total;
    }, 0) || 0;
    
    const expensesOthersOwe = expenses?.reduce((total, expense) => {
      if (expense.paidBy?._id === userIdRef.current) {
        let othersAmount = 0;
        expense.splitBetween?.forEach(split => {
          if (split.user?._id !== userIdRef.current) {
            const amount = split.amount || split.share || 0;
            othersAmount += amount;
            console.log(`${split.user?.name} owes you ${amount} for expense: ${expense.description}`);
          }
        });
        return total + othersAmount;
      }
      return total;
    }, 0) || 0;
    
    console.log("Balances Summary:", {
      loansYouOwe: loansOwed?.reduce((t, l) => t + (l?.amount || 0), 0) || 0,
      loansYoureOwed: loansToCollect?.reduce((t, l) => t + (l?.amount || 0), 0) || 0,
      expensesYouOwe,
      expensesOthersOwe,
      totalYouOwe: (loansOwed?.reduce((t, l) => t + (l?.amount || 0), 0) || 0) + expensesYouOwe,
      totalYoureOwed: (loansToCollect?.reduce((t, l) => t + (l?.amount || 0), 0) || 0) + expensesOthersOwe
    });
  }
}, [isAuthenticated, expenses, loansOwed, loansToCollect]);
  // Add this debugging function to understand your data structure better
useEffect(() => {
  if (isAuthenticated && expenses && expenses.length > 0) {
    // Log a sample expense to see its structure
    console.log("SAMPLE EXPENSE STRUCTURE:", JSON.stringify(expenses[0], null, 2));
    
    // Check splitDetails vs splitBetween naming
    const hasSplitBetween = expenses.some(e => e.splitBetween && e.splitBetween.length);
    const hasSplitDetails = expenses.some(e => e.splitDetails && e.splitDetails.length);
    
    console.log("Expense data structure check:", {
      hasSplitBetween,
      hasSplitDetails,
      totalExpenses: expenses.length
    });
    
    // Check user ID references
    const firstExpense = expenses[0];
    console.log("User ID references:", {
      currentUserId: userIdRef.current,
      paidByUserId: firstExpense?.paidBy?._id,
      splitUsers: firstExpense?.splitBetween?.map(s => s.user?._id) || 
                 firstExpense?.splitDetails?.map(s => s.user?._id),
      doUserIdsMatch: firstExpense?.paidBy?._id === userIdRef.current
    });
  }
}, [isAuthenticated, expenses]);
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (token) {
      setIsAuthenticated(true);
      if (userId) userIdRef.current = userId;
      
      // Fetch user data
      api.getCurrentUser()
        .then(response => {
          if (response.data && response.data.user) {
            setCurrentUser(response.data.user);
            localStorage.setItem('userId', response.data.user._id);
            userIdRef.current = response.data.user._id;
          }
        })
        .catch(err => {
          console.error('Failed to fetch user data', err);
          // If token is invalid, log user out
          if (err.response && err.response.status === 401) {
            handleLogout();
          }
        });
    }
  }, []);



  
  // Updated helper functions to handle either splitBetween or splitDetails
const calculateTotalOwed = () => {
  // Sum from loans where user is borrower
  const loanTotal = Array.isArray(loansOwed) ? loansOwed.reduce((total, loan) => {
    return total + (loan?.amount || 0);
  }, 0) : 0;
  
  // Sum from expenses where user needs to pay others
  const expenseTotal = Array.isArray(expenses) ? expenses.reduce((total, expense) => {
    const userId = userIdRef.current;
    // Skip if user is the one who paid
    if (expense.paidBy && expense.paidBy._id === userId) return total;
    
    // Try splitBetween first, then splitDetails
    const splitArray = expense.splitBetween || expense.splitDetails || [];
    
    // Find what current user owes for this expense
    const userSplit = splitArray.find(split => {
      const splitUserId = split.user?._id || split.user;
      return splitUserId === userId;
    });
    
    if (userSplit) {
      // Handle multiple possible property names for the amount
      const amountOwed = userSplit.amount !== undefined ? userSplit.amount : 
                        (userSplit.share !== undefined ? userSplit.share : 0);
      return total + amountOwed;
    }
    return total;
  }, 0) : 0;
  
  console.log("Debug - You Owe:", { loanTotal, expenseTotal, total: loanTotal + expenseTotal });
  return loanTotal + expenseTotal;
};

const calculateTotalToCollect = () => {
  // Sum from loans where user is lender
  const loanTotal = Array.isArray(loansToCollect) ? loansToCollect.reduce((total, loan) => {
    return total + (loan?.amount || 0);
  }, 0) : 0;
  
  // Sum from expenses where user paid and others owe
  const expenseTotal = Array.isArray(expenses) ? expenses.reduce((total, expense) => {
    const userId = userIdRef.current;
    // Only count if user is the one who paid
    if (!expense.paidBy || expense.paidBy._id !== userId) return total;
    
    // Try splitBetween first, then splitDetails
    const splitArray = expense.splitBetween || expense.splitDetails || [];
    
    // Sum what others owe (everyone except current user)
    let othersOwe = 0;
    splitArray.forEach(split => {
      const splitUserId = split.user?._id || split.user;
      if (splitUserId !== userId) {
        // Handle multiple possible property names for the amount
        const amountOwed = split.amount !== undefined ? split.amount : 
                         (split.share !== undefined ? split.share : 0);
        othersOwe += amountOwed;
      }
    });
    
    return total + othersOwe;
  }, 0) : 0;
  
  console.log("Debug - You're Owed:", { loanTotal, expenseTotal, total: loanTotal + expenseTotal });
  return loanTotal + expenseTotal;
};

  // In the handleAuth function, update this part:

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    try {
      setIsLoading(true);
      const response = await (isLoginView ? api.login(email, password) : api.register(name, email, password));
      
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        // Store user ID - ensure we handle either _id or id
        const userId = response.data.user._id || response.data.user.id;
        if (userId) {
          localStorage.setItem('userId', userId);
          userIdRef.current = userId;
          setCurrentUser(response.data.user);
        }
        
        setIsAuthenticated(true);
        
        // Clear the form fields
        setEmail('');
        setPassword('');
        setName('');
      } else {
        throw new Error('Authentication response missing token');
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Authentication error:', err);
      
      // More specific error messages
      if (err.response && err.response.data) {
        setAuthError(err.response.data.message || (isLoginView ? 'Invalid credentials' : 'Registration failed'));
      } else {
        setAuthError(isLoginView ? 'Invalid credentials' : 'Registration failed');
      }
      
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Use Promise.allSettled to handle partial failures
        const results = await Promise.allSettled([
          api.getAllGroups(),
          api.getAllExpenses(),
          api.getMyLoans(),
          api.getMyTransactions()
        ]);
        
        // Process each result
        if (results[0].status === 'fulfilled') {
          setGroups(results[0].value.data.groups || []);
        }
        
        if (results[1].status === 'fulfilled') {
          setExpenses(results[1].value.data || []);
        }
        
        if (results[2].status === 'fulfilled' && results[2].value.data) {
          const loans = results[2].value.data;
          const userId = userIdRef.current;
          
          if (loans && loans.length) {
            // Separate loans based on user's role
            setLoansOwed(loans.filter((loan: LoanState) => loan.borrower._id === userId));
            setLoansToCollect(loans.filter((loan: LoanState) => loan.lender._id === userId));
          }
        }
        
        if (results[3].status === 'fulfilled' && results[3].value.data) {
          setTransactions(results[3].value.data.transactions || []);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError('Failed to fetch dashboard data');
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Update the fetchTabData function to properly handle loans
const fetchTabData = async (tab) => {
  try {
    setIsLoading(true);
    setError(null);

    switch (tab) {
      // ... other cases
      
      case 'loans':
        console.log("Fetching loans data...");
        const loansRes = await api.getMyLoans();
        console.log("Raw loans response:", loansRes);
        
        // Check if loans are in data property or directly in response
        const loansData = loansRes.data?.loans || loansRes.data || [];
        console.log("Processed loans data:", loansData);
        
        if (Array.isArray(loansData)) {
          const userId = userIdRef.current;
          console.log("Filtering loans for user ID:", userId);
          
          const owed = loansData.filter(loan => loan.borrower._id === userId);
          const toCollect = loansData.filter(loan => loan.lender._id === userId);
          
          console.log("Filtered loans:", { owed, toCollect });
          
          setLoansOwed(owed);
          setLoansToCollect(toCollect);
        } else {
          console.error("Loans data is not an array:", loansData);
          setLoansOwed([]);
          setLoansToCollect([]);
        }
        break;
    }
    setIsLoading(false);
  } catch (err) {
    console.error(`Error fetching ${tab} data:`, err);
    setError(`Failed to load ${tab} data`);
    setIsLoading(false);
  }
};

    if (activeTab !== 'dashboard' && activeTab !== 'transactions') {
      fetchTabData();
    }
  }, [activeTab, isAuthenticated]);

  // Create Group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setError('Group name cannot be empty');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await api.createGroup(newGroupName.trim());
      
      // Refresh groups list
      const groupsRes = await api.getAllGroups();
      if (groupsRes.data && groupsRes.data.groups) {
        setGroups(groupsRes.data.groups);
      }
      
      // Reset form and close modal
      setNewGroupName('');
      setShowGroupModal(false);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to create group:', err);
      setError('Failed to create group');
      setIsLoading(false);
    }
  };

  // Add Expense
  const handleAddExpense = async () => {
    if (!newExpense.description.trim() || newExpense.amount <= 0 || !newExpense.groupId) {
      setError('Please fill in all expense fields');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // For simplicity, split between all group members
      const group = groups.find(g => g._id === newExpense.groupId);
      const splitBetween = group ? group.members.map(member => member._id) : [];
      
      await api.createExpense(
        newExpense.groupId,
        newExpense.amount,
        newExpense.description.trim(),
        splitBetween
      );
      
      // Refresh expenses list
      const expensesRes = await api.getAllExpenses();
      if (expensesRes.data) {
        setExpenses(expensesRes.data);
      }
      
      // Reset form and close modal
      setNewExpense({
        groupId: '',
        amount: 0,
        description: '',
        splitBetween: []
      });
      setShowExpenseModal(false);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to add expense:', err);
      setError('Failed to add expense');
      setIsLoading(false);
    }
  };

  // Create Loan
// Create Loan
// Update the handleCreateLoan function to add the new loan to state
const handleCreateLoan = async () => {
  // ... existing validation code ...
  
  try {
    setIsLoading(true);
    setError(null);
    
    // ... existing lookup and creation code ...
    
    // Create the loan with the borrower's ID
    const response = await api.createLoan(
      newLoan.amount,
      borrowerId,
      newLoan.description.trim()
    );
    
    console.log("Loan created successfully:", response);
    
    // Refresh loans list
    const loansRes = await api.getMyLoans();
    console.log("Refreshed loans data:", loansRes);
    
    // Check if loans are in data property or directly in response
    const loansData = loansRes.data?.loans || loansRes.data || [];
    
    if (Array.isArray(loansData) && loansData.length > 0) {
      const userId = userIdRef.current;
      
      const owed = loansData.filter(loan => loan.borrower._id === userId);
      const toCollect = loansData.filter(loan => loan.lender._id === userId);
      
      console.log("Updated loans state:", { owed, toCollect });
      
      setLoansOwed(owed);
      setLoansToCollect(toCollect);
    } else {
      // If response structure is unexpected, manually add the new loan to state
      if (response.data) {
        const newLoanData = response.data;
        const userId = userIdRef.current;
        
        if (newLoanData.borrower._id === userId) {
          setLoansOwed(prev => [...prev, newLoanData]);
        } else if (newLoanData.lender._id === userId) {
          setLoansToCollect(prev => [...prev, newLoanData]);
        }
      }
    }
    
    // Reset form and close modal
    setNewLoan({
      amount: 0,
      borrowerId: '',
      description: ''
    });
    setShowLoanModal(false);
    setIsLoading(false);
  } catch (err) {
    console.error('Failed to create loan:', err);
    setError('Failed to create loan');
    setIsLoading(false);
  }
};
  // Add User to Group
  const handleAddUserToGroup = async () => {
    if (!selectedGroupId || !inviteEmail.trim()) {
      setError('Both group and email are required');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await api.addUserToGroup(selectedGroupId, inviteEmail.trim());
      
      // Refresh the groups
      const groupsRes = await api.getAllGroups();
      if (groupsRes.data && groupsRes.data.groups) {
        setGroups(groupsRes.data.groups);
      }
      
      // Reset and close modal
      setInviteEmail('');
      setSelectedGroupId('');
      setShowInviteModal(false);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to add user to group:', err);
      setError('Failed to add user to group');
      setIsLoading(false);
    }
  };

  const handleSettleLoan = async (loanId: string) => {
    try {
      setIsLoading(true);
      await api.settleLoan(loanId);
      
      // Refresh loans
      const loansRes = await api.getMyLoans();
      if (loansRes.data) {
        const loans = loansRes.data;
        const userId = userIdRef.current;
        
        setLoansOwed(loans.filter(loan => loan.borrower._id === userId));
        setLoansToCollect(loans.filter(loan => loan.lender._id === userId));
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to settle loan:', err);
      setError('Failed to settle loan');
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    userIdRef.current = null;
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const navItems = [
    { icon: <Wallet className="w-5 h-5" />, label: 'Dashboard', id: 'dashboard' },
    { icon: <Users className="w-5 h-5" />, label: 'Groups', id: 'groups' },
    { icon: <Receipt className="w-5 h-5" />, label: 'Expenses', id: 'expenses' },
    { icon: <CreditCard className="w-5 h-5" />, label: 'Loans', id: 'loans' },
    { icon: <History className="w-5 h-5" />, label: 'Transactions', id: 'transactions' },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Wallet className="w-12 h-12 text-neon-purple" />
            <h1 className="text-4xl font-bold text-neon-purple">CashMate</h1>
          </div>
          <div className="bg-dark-card p-8 rounded-xl border border-gray-800">
            <h2 className="text-2xl font-bold mb-6 text-center">
              {isLoginView ? 'Welcome Back!' : 'Create Account'}
            </h2>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLoginView && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
                    Name
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-dark pl-12 pr-4 py-3 rounded-lg border border-gray-800 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-colors"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-dark pl-12 pr-4 py-3 rounded-lg border border-gray-800 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-colors"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-dark pl-12 pr-4 py-3 rounded-lg border border-gray-800 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-colors"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>
              {authError && (
                <div className="bg-red-500 bg-opacity-10 text-red-500 p-3 rounded-lg text-sm">
                  {authError}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-neon-purple py-3 rounded-lg font-medium hover:shadow-neon transition-shadow"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Create Account')}
              </button>
            </form>
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLoginView(!isLoginView)}
                className="text-gray-400 hover:text-neon-purple transition-colors"
              >
                {isLoginView ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-purple"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-500 bg-opacity-10 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      );
    }

    switch (activeTab) {
      case 'groups':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">My Groups</h1>
              <button 
                onClick={() => setShowGroupModal(true)} 
                className="flex items-center gap-2 bg-neon-purple px-4 py-2 rounded-lg hover:shadow-neon transition-shadow"
              >
                <Plus className="w-4 h-4" />
                New Group
              </button>
            </div>
            {groups.length === 0 ? (
              <div className="bg-dark-card p-8 rounded-xl border border-gray-800 text-center">
                <p className="text-gray-400">You don't have any groups yet.</p>
                <button 
                  onClick={() => setShowGroupModal(true)}
                  className="mt-4 py-2 px-4 bg-neon-purple rounded-lg hover:shadow-neon transition-shadow"
                >
                  Create Your First Group
                </button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => (
                  <div key={group._id} className="bg-dark-card p-6 rounded-xl border border-gray-800 hover:border-neon-purple transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold">{group.groupName}</h3>
                      <span className="text-sm text-gray-400">{group.members?.length || 0} members</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Created on</span>
                        <span className="text-neon-purple">{new Date(group.createdAt).toLocaleDateString()}</span>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedGroupId(group._id);
                          setShowInviteModal(true);
                        }}
                        className="w-full py-2 px-4 border border-neon-purple text-neon-purple rounded-lg hover:shadow-neon transition-shadow flex items-center justify-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Invite Member
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'expenses':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Expenses</h1>
              <button 
                onClick={() => setShowExpenseModal(true)} 
                className="flex items-center gap-2 bg-neon-purple px-4 py-2 rounded-lg hover:shadow-neon transition-shadow"
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </button>
            </div>
            {expenses.length === 0 ? (
              <div className="bg-dark-card p-8 rounded-xl border border-gray-800 text-center">
                <p className="text-gray-400">You don't have any expenses yet.</p>
                <button 
                  onClick={() => setShowExpenseModal(true)}
                  className="mt-4 py-2 px-4 bg-neon-purple rounded-lg hover:shadow-neon transition-shadow"
                >
                  Add Your First Expense
                </button>
              </div>
            ) : (
              <div className="bg-dark-card rounded-xl border border-gray-800">
                {expenses.map((expense) => {
  // Find the amount the current user owes
  const userId = userIdRef.current;
  const userSplit = expense.splitBetween?.find(split => split.user._id === userId);
  const youOwe = userSplit ? (userSplit.amount || userSplit.share || 0) : 0;
  
  // Determine if current user is the one who paid
  const userIsPayer = expense.paidBy?._id === userId;
  
  return (
    <div key={expense._id} className="p-4 border-b border-gray-800 last:border-0 hover:bg-dark-lighter transition-colors">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Receipt className="w-5 h-5 text-neon-purple" />
          <div>
            <p className="font-medium">{expense.description}</p>
            <p className="text-sm text-gray-500">
              Paid by {userIsPayer ? 'you' : expense.paidBy?.name || 'unknown'} • 
              {expense.date ? new Date(expense.date).toLocaleDateString() : 'Today'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-medium text-neon-purple">${expense.amount.toFixed(2)}</p>
          {!userIsPayer && (
            <p className="text-sm text-gray-500">You owe ${youOwe.toFixed(2)}</p>
          )}
          {userIsPayer && youOwe < expense.amount && (
            <p className="text-sm text-green-500">Others owe ${(expense.amount - youOwe).toFixed(2)}</p>
          )}
        </div>
      </div>
    </div>
  );
})}
              </div>
            )}
          </div>
        );

        case 'loans':
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Loans & Balances</h1>
        <button 
          onClick={() => setShowLoanModal(true)} 
          className="flex items-center gap-2 bg-neon-purple px-4 py-2 rounded-lg hover:shadow-neon transition-shadow"
        >
          <Plus className="w-4 h-4" />
          New Loan
        </button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-dark-card p-6 rounded-xl border border-gray-800">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-red-500" />
            You Owe
          </h2>
          
          {/* Show direct loans first */}
          {loansOwed && loansOwed.length > 0 && (
            <>
              <h3 className="text-md text-gray-400 mb-2">Loans</h3>
              {loansOwed.map((loan) => (
                <div key={loan._id} className="flex justify-between items-center py-3 border-b border-gray-800">
                  <div>
                    <span>{loan.lender?.name}</span>
                    <p className="text-xs text-gray-500">{loan.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">${loan.amount.toFixed(2)}</span>
                    <button 
                      onClick={() => handleSettleLoan(loan._id)}
                      className="px-3 py-1 text-sm border border-neon-purple text-neon-purple rounded-lg hover:shadow-neon transition-shadow"
                    >
                      Settle
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
          
          {/* Now show expense-based debts */}
          {expenses && expenses.length > 0 && (
  <>
    <h3 className="text-md text-gray-400 mt-4 mb-2">Expense Debts</h3>
    {expenses
      .filter(e => {
        const userId = userIdRef.current;
        // Skip if user is the one who paid
        if (e.paidBy && e.paidBy._id === userId) return false;
        
        // Try splitBetween first, then splitDetails
        const splitArray = e.splitBetween || e.splitDetails || [];
        
        // Find what current user owes for this expense
        const userSplit = splitArray.find(split => {
          const splitUserId = split.user?._id || split.user;
          return splitUserId === userId;
        });
        
        // Only show if user owes something
        return userSplit && (userSplit.amount || userSplit.share || 0) > 0;
      })
      .map((expense) => {
        // Find the amount the current user owes
        const userId = userIdRef.current;
        
        // Try splitBetween first, then splitDetails
        const splitArray = expense.splitBetween || expense.splitDetails || [];
        
        const userSplit = splitArray.find(split => {
          const splitUserId = split.user?._id || split.user;
          return splitUserId === userId;
        });
        
        const youOwe = userSplit ? 
          (userSplit.amount !== undefined ? userSplit.amount : 
           (userSplit.share !== undefined ? userSplit.share : 0)) : 0;
        
        return (
          <div key={expense._id} className="flex justify-between items-center py-3 border-b border-gray-800 last:border-0">
            <div>
              <span>{expense.paidBy?.name}</span>
              <p className="text-xs text-gray-500">{expense.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-500">${youOwe.toFixed(2)}</span>
            </div>
          </div>
        );
      })
    }
  </>
)}
          
          {(!loansOwed || loansOwed.length === 0) && 
           (!expenses || !expenses.some(e => 
              e.paidBy && e.paidBy._id !== userIdRef.current && 
              e.splitBetween && e.splitBetween.some(split => 
                split.user && split.user._id === userIdRef.current && 
                ((split.amount && split.amount > 0) || (split.share && split.share > 0))
              )
            )) && (
            <p className="text-gray-400 text-center py-3">No outstanding debts. Great job!</p>
          )}
        </div>

        <div className="bg-dark-card p-6 rounded-xl border border-gray-800">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            You're Owed
          </h2>
          
          {/* Show direct loans first */}
          {loansToCollect && loansToCollect.length > 0 && (
            <>
              <h3 className="text-md text-gray-400 mb-2">Loans</h3>
              {loansToCollect.map((loan) => (
                <div key={loan._id} className="flex justify-between items-center py-3 border-b border-gray-800">
                  <div>
                    <span>{loan.borrower?.name}</span>
                    <p className="text-xs text-gray-500">{loan.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">${loan.amount.toFixed(2)}</span>
                    <button className="px-3 py-1 text-sm border border-neon-purple text-neon-purple rounded-lg hover:shadow-neon transition-shadow">
                      Remind
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
          
          {/* Now show expense-based credits */}
          {expenses && expenses.some(e => 
            e.paidBy && e.paidBy._id === userIdRef.current &&
            e.splitBetween && e.splitBetween.some(split => 
              split.user && split.user._id !== userIdRef.current && 
              ((split.amount && split.amount > 0) || (split.share && split.share > 0))
            )
          ) && (
            <>
              <h3 className="text-md text-gray-400 mt-4 mb-2">Expense Credits</h3>
              {expenses
                .filter(e => e.paidBy && e.paidBy._id === userIdRef.current)
                .map((expense) => {
                  // Sum of what others owe
                  const userId = userIdRef.current;
                  let othersOwe = 0;
                  
                  expense.splitBetween?.forEach(split => {
                    if (split.user && split.user._id !== userId) {
                      const amountOwed = split.amount !== undefined ? split.amount : 
                                       (split.share !== undefined ? split.share : 0);
                      othersOwe += amountOwed;
                    }
                  });
                  
                  if (othersOwe <= 0) return null;
                  
                  return (
                    <div key={expense._id} className="flex justify-between items-center py-3 border-b border-gray-800 last:border-0">
                      <div>
                        <span>Group members</span>
                        <p className="text-xs text-gray-500">{expense.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">${othersOwe.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })
              }
            </>
          )}
          
          {(!loansToCollect || loansToCollect.length === 0) && 
           (!expenses || !expenses.some(e => 
              e.paidBy && e.paidBy._id === userIdRef.current &&
              e.splitBetween && e.splitBetween.some(split => 
                split.user && split.user._id !== userIdRef.current && 
                ((split.amount && split.amount > 0) || (split.share && split.share > 0))
              )
            )) && (
            <p className="text-gray-400 text-center py-3">No one owes you money.</p>
          )}
        </div>
      </div>
      
      {/* Modal code remains unchanged */}
    </div>
  );
    case 'transactions':
        return <TransactionHistory />;

      default:
        return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Quick Actions Card */}
            <div className="bg-dark-card p-6 rounded-xl border border-gray-800">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowExpenseModal(true)}
                  className="w-full py-2 px-4 bg-neon-purple rounded-lg hover:shadow-neon transition-shadow"
                >
                  Add Expense
                </button>
                <button 
                  onClick={() => setShowGroupModal(true)}
                  className="w-full py-2 px-4 border border-neon-purple text-neon-purple rounded-lg hover:shadow-neon transition-shadow"
                >
                  Create Group
                </button>
                <button 
                  onClick={() => setShowLoanModal(true)}
                  className="w-full py-2 px-4 border border-neon-purple text-neon-purple rounded-lg hover:shadow-neon transition-shadow"
                >
                  Create Loan
                </button>
              </div>
            </div>

            {/* Recent Activity Card */}
            <div className="bg-dark-card p-6 rounded-xl border border-gray-800">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {expenses.slice(0, 3).map((expense) => (
                  <div key={expense._id} className="flex items-center gap-3 text-gray-300">
                    <Receipt className="w-5 h-5 text-neon-purple" />
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-gray-500">Added {new Date(expense.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {expenses.length === 0 && (
                  <p className="text-gray-400 text-center">No recent activity</p>
                )}
              </div>
            </div>

            {/* Balance Overview Card */}
            <div className="bg-dark-card p-6 rounded-xl border border-gray-800">
              <h2 className="text-xl font-semibold mb-4">Balance Overview</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>You owe</span>
                  <span className="text-red-500">
                    ${calculateTotalOwed().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>You are owed</span>
                  <span className="text-green-500">
                    ${calculateTotalToCollect().toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-800">
                  <div className="flex justify-between items-center">
                    <span>Total balance</span>
                    <span className={`font-semibold ${calculateTotalToCollect() - calculateTotalOwed() >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ${(calculateTotalToCollect() - calculateTotalOwed()).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-dark text-white">
      {/* Sidebar for desktop */}
      <nav className="hidden md:flex fixed h-full w-64 bg-dark-lighter flex-col p-4">
        <div className="flex items-center gap-2 mb-8">
          <Wallet className="w-8 h-8 text-neon-purple" />
          <h1 className="text-2xl font-bold text-neon-purple">CashMate</h1>
        </div>
        <div className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:text-neon-purple ${
                activeTab === item.id ? 'bg-dark-card text-neon-purple' : 'hover:bg-dark-card'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="mt-auto w-full py-2 px-4 border border-neon-purple text-neon-purple rounded-lg hover:shadow-neon transition-shadow"
        >
          Logout
        </button>
      </nav>

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-dark-lighter">
        <div className="flex items-center gap-2">
          <Wallet className="w-6 h-6 text-neon-purple" />
          <h1 className="text-xl font-bold text-neon-purple">CashMate</h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-300"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-dark-lighter">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-gray-300 hover:text-neon-purple ${
                activeTab === item.id ? 'bg-dark-card text-neon-purple' : 'hover:bg-dark-card'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-dark-card transition-colors"
          >
            Logout
          </button>
        </div>
      )}

      {/* Main content */}
      <main className="md:ml-64 p-6">
        {renderContent()}
      </main>

      {/* Add Expense Modal - Using the format from TransactionHistory */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card rounded-xl border border-gray-800 w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-800">
              <h3 className="text-xl font-semibold">Add New Expense</h3>
              <button 
                onClick={() => setShowExpenseModal(false)} 
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="expenseGroup" className="block text-sm font-medium text-gray-400 mb-1">
                    Group
                  </label>
                  <select
                    id="expenseGroup"
                    value={newExpense.groupId}
                    onChange={(e) => setNewExpense({...newExpense, groupId: e.target.value})}
                    className="w-full bg-dark px-4 py-3 rounded-lg border border-gray-800 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-colors"
                  >
                    <option value="">Select a group</option>
                    {groups.map(group => (
                      <option key={group._id} value={group._id}>{group.groupName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="expenseAmount" className="block text-sm font-medium text-gray-400 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    id="expenseAmount"
                    value={newExpense.amount === 0 ? '' : newExpense.amount}
                    onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
                    className="w-full bg-dark px-4 py-3 rounded-lg border border-gray-800 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-colors"
                    placeholder="Enter amount"
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="expenseDesc" className="block text-sm font-medium text-gray-400 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    id="expenseDesc"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    className="w-full bg-dark px-4 py-3 rounded-lg border border-gray-800 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-colors"
                    placeholder="What is this expense for?"
                  />
                </div>
                <button
                  onClick={handleAddExpense}
                  className="w-full bg-neon-purple py-3 rounded-lg font-medium hover:shadow-neon transition-shadow"
                  disabled={isLoading}
                >
                  {isLoading ? 'Adding...' : 'Add Expense'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal - Using the format from TransactionHistory */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card rounded-xl border border-gray-800 w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-800">
              <h3 className="text-xl font-semibold">Create New Group</h3>
              <button 
                onClick={() => setShowGroupModal(false)} 
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="groupName" className="block text-sm font-medium text-gray-400 mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    id="groupName"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full bg-dark px-4 py-3 rounded-lg border border-gray-800 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-colors"
                    placeholder="Enter group name"
                  />
                </div>
                <button
                  onClick={handleCreateGroup}
                  className="w-full bg-neon-purple py-3 rounded-lg font-medium hover:shadow-neon transition-shadow"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Loan Modal - Using the format from TransactionHistory */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card rounded-xl border border-gray-800 w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-800">
              <h3 className="text-xl font-semibold">Create New Loan</h3>
              <button 
                onClick={() => setShowLoanModal(false)} 
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="loanBorrower" className="block text-sm font-medium text-gray-400 mb-1">
                    Borrower Email
                  </label>
                  <input
                    type="email"
                    id="loanBorrower"
                    value={newLoan.borrowerId}
                    onChange={(e) => setNewLoan({...newLoan, borrowerId: e.target.value})}
                    className="w-full bg-dark px-4 py-3 rounded-lg border border-gray-800 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-colors"
                    placeholder="Enter borrower's email"
                  />
                </div>
                <div>
                  <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-400 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    id="loanAmount"
                    value={newLoan.amount === 0 ? '' : newLoan.amount}
                    onChange={(e) => setNewLoan({...newLoan, amount: parseFloat(e.target.value) || 0})}
                    className="w-full bg-dark px-4 py-3 rounded-lg border border-gray-800 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-colors"
                    placeholder="Enter amount"
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="loanDesc" className="block text-sm font-medium text-gray-400 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    id="loanDesc"
                    value={newLoan.description}
                    onChange={(e) => setNewLoan({...newLoan, description: e.target.value})}
                    className="w-full bg-dark px-4 py-3 rounded-lg border border-gray-800 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-colors"
                    placeholder="What is this loan for?"
                  />
                </div>
                <button
                  onClick={handleCreateLoan}
                  className="w-full bg-neon-purple py-3 rounded-lg font-medium hover:shadow-neon transition-shadow"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Loan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal - Using the format from TransactionHistory */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card rounded-xl border border-gray-800 w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-800">
              <h3 className="text-xl font-semibold">Invite Member</h3>
              <button 
                onClick={() => {
                  setShowInviteModal(false);
                  setSelectedGroupId('');
                  setInviteEmail('');
                }} 
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="inviteEmail"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-dark px-4 py-3 rounded-lg border border-gray-800 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-colors"
                    placeholder="Enter email address"
                  />
                </div>
                <button
                  onClick={handleAddUserToGroup}
                  className="w-full bg-neon-purple py-3 rounded-lg font-medium hover:shadow-neon transition-shadow"
                  disabled={isLoading}
                >
                  {isLoading ? 'Inviting...' : 'Send Invitation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;