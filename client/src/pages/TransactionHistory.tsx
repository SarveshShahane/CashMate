import React, { useState, useEffect, useRef } from 'react';
import { History, ArrowUp, ArrowDown, Search, Plus } from 'lucide-react';
import * as api from '../api';

interface Transaction {
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

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showNewTransactionModal, setShowNewTransactionModal] = useState<boolean>(false);
  const userIdRef = useRef<string | null>(localStorage.getItem('userId'));

  const [newTransaction, setNewTransaction] = useState({
    amount: 0,
    recipientId: '',
    description: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async (start?: string, end?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.getMyTransactions();
      if (response.data && response.data.transactions) {
        setTransactions(response.data.transactions);
      } else {
        setTransactions([]);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleCreateTransaction = async () => {
    if (!newTransaction.recipientId.trim() || newTransaction.amount <= 0) {
      setError('Please enter a valid recipient email and amount');
      return;
    }
    
    try {
      setIsLoading(true);
      await api.createTransaction(
        newTransaction.amount,
        newTransaction.recipientId,
        newTransaction.description
      );
      
      // Reset form and close modal
      setNewTransaction({
        amount: 0,
        recipientId: '',
        description: ''
      });
      setShowNewTransactionModal(false);
      
      // Refresh transactions
      fetchTransactions();
    } catch (err) {
      console.error('Failed to create transaction:', err);
      setError('Failed to create transaction. Please try again.');
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      transaction.description?.toLowerCase().includes(searchLower) ||
      transaction.sender.name.toLowerCase().includes(searchLower) ||
      transaction.receiver.name.toLowerCase().includes(searchLower) ||
      transaction.amount.toString().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="w-6 h-6" />
          Transaction History
        </h1>
        <button 
          onClick={() => setShowNewTransactionModal(true)}
          className="flex items-center gap-2 bg-neon-purple px-4 py-2 rounded-lg hover:shadow-neon transition-shadow"
        >
          <Plus className="w-4 h-4" />
          Send Money
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-dark-card p-4 rounded-xl border border-gray-800">
        <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-500 w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search transactions..."
              className="bg-dark py-3 pl-10 pr-4 rounded-lg border border-gray-800 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-colors w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <input
            type="date"
            placeholder="Start Date"
            className="bg-dark py-3 px-4 rounded-lg border border-gray-800 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-colors"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          
          <input
            type="date"
            placeholder="End Date"
            className="bg-dark py-3 px-4 rounded-lg border border-gray-800 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-colors"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          
          <div className="flex gap-2 md:col-span-4">
            <button 
              type="submit"
              className="bg-neon-purple px-4 py-2 rounded-lg hover:shadow-neon transition-shadow"
            >
              Apply Filters
            </button>
            <button 
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStartDate('');
                setEndDate('');
                fetchTransactions('', '');
              }}
              className="px-4 py-2 border border-gray-700 rounded-lg hover:border-gray-500 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </form>
      </div>

      {/* Transactions List */}
      {error && (
        <div className="bg-red-500 bg-opacity-10 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-purple"></div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-dark-card p-8 rounded-xl border border-gray-800 text-center">
          <p className="text-gray-400">No transactions found</p>
        </div>
      ) : (
        <div className="bg-dark-card rounded-xl border border-gray-800 overflow-hidden">
          {filteredTransactions.map((transaction) => {
            const isSender = transaction.sender._id === userIdRef.current;
            
            return (
              <div key={transaction._id} className="p-4 border-b border-gray-800 last:border-0 hover:bg-dark-lighter transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isSender ? 'bg-red-500 bg-opacity-10' : 'bg-green-500 bg-opacity-10'}`}>
                      {isSender ? <ArrowUp className="w-5 h-5 text-red-500" /> : <ArrowDown className="w-5 h-5 text-green-500" />}
                    </div>
                    <div>
                      <p className="font-medium">
                        {isSender ? `To: ${transaction.receiver.name}` : `From: ${transaction.sender.name}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.description || 'No description'} • {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className={`font-medium ${isSender ? 'text-red-500' : 'text-green-500'}`}>
                    {isSender ? '-' : '+'} ${transaction.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Transaction Modal */}
      {showNewTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card rounded-xl border border-gray-800 w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-800">
              <h3 className="text-xl font-semibold">Send Money</h3>
              <button 
                onClick={() => setShowNewTransactionModal(false)} 
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="recipientId" className="block text-sm font-medium text-gray-400 mb-1">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    id="recipientId"
                    value={newTransaction.recipientId}
                    onChange={(e) => setNewTransaction({...newTransaction, recipientId: e.target.value})}
                    className="w-full bg-dark px-4 py-3 rounded-lg border border-gray-800 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-colors"
                    placeholder="Enter recipient's email"
                  />
                </div>
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    id="amount"
                    value={newTransaction.amount === 0 ? '' : newTransaction.amount}
                    onChange={(e) => setNewTransaction({...newTransaction, amount: parseFloat(e.target.value) || 0})}
                    className="w-full bg-dark px-4 py-3 rounded-lg border border-gray-800 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-colors"
                    placeholder="Enter amount"
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    id="description"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                    className="w-full bg-dark px-4 py-3 rounded-lg border border-gray-800 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-colors"
                    placeholder="What's this payment for?"
                  />
                </div>
                <button
                  onClick={handleCreateTransaction}
                  className="w-full bg-neon-purple py-3 rounded-lg font-medium hover:shadow-neon transition-shadow"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Send Money'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;