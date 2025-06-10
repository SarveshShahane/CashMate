import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { transactionApi, authApi } from '../../services/api';
import { Transaction, User } from '../../types';
import { useForm } from 'react-hook-form';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search,
  Calendar,
  Filter
} from 'lucide-react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import EmptyState from '../../components/UI/EmptyState';
import toast from 'react-hot-toast';

interface TransactionForm {
  recipientEmail: string;
  amount: number;
  description: string;
}

interface FilterForm {
  startDate: string;
  endDate: string;
  searchTerm: string;
}

const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const {
    register: registerTransaction,
    handleSubmit: handleTransactionSubmit,
    reset: resetTransaction,
    formState: { errors: transactionErrors },
  } = useForm<TransactionForm>();

  const {
    register: registerFilter,
    handleSubmit: handleFilterSubmit,
    reset: resetFilter,
    watch,
  } = useForm<FilterForm>();

  const searchTerm = watch('searchTerm', '');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await transactionApi.getAll();
      setTransactions(response.data.transactions);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const onCreateTransaction = async (data: TransactionForm) => {
    setIsCreating(true);
    try {
      // First, find the user by email
      const userResponse = await authApi.searchUser(data.recipientEmail);
      const recipient = userResponse.data.user;

      await transactionApi.create(data.amount, recipient._id, data.description);
      toast.success('Transaction created successfully');
      setIsCreateModalOpen(false);
      resetTransaction();
      fetchTransactions();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create transaction';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const onFilter = async (data: FilterForm) => {
    try {
      setIsLoading(true);
      const response = await transactionApi.getByDateRange(data.startDate, data.endDate);
      setTransactions(response.data.transactions);
      setIsFilterOpen(false);
    } catch (error) {
      toast.error('Failed to filter transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    resetFilter();
    fetchTransactions();
    setIsFilterOpen(false);
  };

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(transaction => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      transaction.sender.name.toLowerCase().includes(term) ||
      transaction.receiver.name.toLowerCase().includes(term) ||
      transaction.description?.toLowerCase().includes(term) ||
      transaction.amount.toString().includes(term)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">Manage your money transfers</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="btn-secondary"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Send Money
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          {...registerFilter('searchTerm')}
          type="text"
          className="input pl-10"
          placeholder="Search transactions..."
        />
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          icon={<ArrowUpRight className="w-12 h-12" />}
          title="No transactions found"
          description="Start by sending money to someone or receive your first payment."
          action={
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Send Money
            </button>
          }
        />
      ) : (
        <div className="card">
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => {
              const isSender = transaction.sender._id === user?._id;
              return (
                <div key={transaction._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${
                        isSender ? 'bg-danger-100' : 'bg-success-100'
                      }`}>
                        {isSender ? (
                          <ArrowUpRight className="w-5 h-5 text-danger-600" />
                        ) : (
                          <ArrowDownLeft className="w-5 h-5 text-success-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {isSender ? `To: ${transaction.receiver.name}` : `From: ${transaction.sender.name}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {transaction.description || 'No description'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(transaction.date).toLocaleDateString()} at{' '}
                          {new Date(transaction.date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        isSender ? 'text-danger-600' : 'text-success-600'
                      }`}>
                        {isSender ? '-' : '+'}${transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isSender ? transaction.receiver.email : transaction.sender.email}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Transaction Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Send Money"
      >
        <form onSubmit={handleTransactionSubmit(onCreateTransaction)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Email
            </label>
            <input
              {...registerTransaction('recipientEmail', {
                required: 'Recipient email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Invalid email address',
                },
              })}
              type="email"
              className="input"
              placeholder="Enter recipient's email"
            />
            {transactionErrors.recipientEmail && (
              <p className="mt-1 text-sm text-danger-600">
                {transactionErrors.recipientEmail.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              {...registerTransaction('amount', {
                required: 'Amount is required',
                min: {
                  value: 0.01,
                  message: 'Amount must be greater than 0',
                },
              })}
              type="number"
              step="0.01"
              className="input"
              placeholder="0.00"
            />
            {transactionErrors.amount && (
              <p className="mt-1 text-sm text-danger-600">
                {transactionErrors.amount.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <input
              {...registerTransaction('description')}
              type="text"
              className="input"
              placeholder="What's this payment for?"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="btn-primary"
            >
              {isCreating ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Sending...
                </div>
              ) : (
                'Send Money'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Filter Modal */}
      <Modal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter Transactions"
      >
        <form onSubmit={handleFilterSubmit(onFilter)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              {...registerFilter('startDate')}
              type="date"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              {...registerFilter('endDate')}
              type="date"
              className="input"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={clearFilters}
              className="btn-secondary"
            >
              Clear Filters
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Transactions;