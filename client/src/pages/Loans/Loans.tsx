import React, { useState, useEffect } from 'react';
import { loanApi, authApi } from '../../services/api';
import { Loan } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { 
  Plus, 
  HandCoins, 
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  Calendar
} from 'lucide-react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import EmptyState from '../../components/UI/EmptyState';
import toast from 'react-hot-toast';

interface LoanForm {
  borrowerEmail: string;
  amount: number;
  reason: string;
}

const Loans: React.FC = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'given' | 'taken'>('all');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoanForm>();

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setIsLoading(true);
      const response = await loanApi.getAll();
      setLoans(response.data.loans);
    } catch (error) {
      toast.error('Failed to fetch loans');
    } finally {
      setIsLoading(false);
    }
  };

  const onCreateLoan = async (data: LoanForm) => {
    setIsCreating(true);
    try {
      // First, find the user by email
      const userResponse = await authApi.searchUser(data.borrowerEmail);
      const borrower = userResponse.data.user;

      await loanApi.create(borrower._id, data.amount, data.reason);
      toast.success('Loan created successfully');
      setIsCreateModalOpen(false);
      reset();
      fetchLoans();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create loan';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const onSettleLoan = async (loanId: string) => {
    try {
      await loanApi.settle(loanId);
      toast.success('Loan settled successfully');
      fetchLoans();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to settle loan';
      toast.error(message);
    }
  };

  // Filter loans based on active tab
  const filteredLoans = loans.filter(loan => {
    switch (activeTab) {
      case 'given':
        return loan.lender._id === user?._id;
      case 'taken':
        return loan.borrower._id === user?._id;
      default:
        return true;
    }
  });

  // Calculate summary statistics
  const totalGiven = loans
    .filter(l => l.lender._id === user?._id && l.status === 'pending')
    .reduce((sum, l) => sum + l.amount, 0);

  const totalTaken = loans
    .filter(l => l.borrower._id === user?._id && l.status === 'pending')
    .reduce((sum, l) => sum + l.amount, 0);

  const settledCount = loans.filter(l => l.status === 'settled').length;

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
          <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
          <p className="text-gray-600">Track money you've lent and borrowed</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Loan
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">You're Owed</p>
                <p className="text-2xl font-bold text-success-600">
                  ${totalGiven.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-success-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">You Owe</p>
                <p className="text-2xl font-bold text-danger-600">
                  ${totalTaken.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-danger-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-danger-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Settled Loans</p>
                <p className="text-2xl font-bold text-gray-900">
                  {settledCount}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All Loans', count: loans.length },
            { key: 'given', label: 'Given', count: loans.filter(l => l.lender._id === user?._id).length },
            { key: 'taken', label: 'Taken', count: loans.filter(l => l.borrower._id === user?._id).length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Loans List */}
      {filteredLoans.length === 0 ? (
        <EmptyState
          icon={<HandCoins className="w-12 h-12" />}
          title="No loans found"
          description="Create your first loan to start tracking money you lend or borrow."
          action={
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Loan
            </button>
          }
        />
      ) : (
        <div className="card">
          <div className="divide-y divide-gray-200">
            {filteredLoans.map((loan) => {
              const isLender = loan.lender._id === user?._id;
              const otherUser = isLender ? loan.borrower : loan.lender;
              
              return (
                <div key={loan._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${
                        loan.status === 'settled' 
                          ? 'bg-gray-100' 
                          : isLender 
                            ? 'bg-success-100' 
                            : 'bg-danger-100'
                      }`}>
                        {loan.status === 'settled' ? (
                          <CheckCircle className="w-5 h-5 text-gray-600" />
                        ) : isLender ? (
                          <TrendingUp className="w-5 h-5 text-success-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-danger-600" />
                        )}
                      </div>
                      
                      <div>
                        <p className="font-semibold text-gray-900">
                          {isLender ? `Lent to ${otherUser.name}` : `Borrowed from ${otherUser.name}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {loan.reason || 'No reason provided'}
                        </p>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(loan.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            {loan.status === 'pending' ? (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                <span className="badge-warning">Pending</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                <span className="badge-success">Settled</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          loan.status === 'settled' 
                            ? 'text-gray-500' 
                            : isLender 
                              ? 'text-success-600' 
                              : 'text-danger-600'
                        }`}>
                          {isLender ? '+' : '-'}${loan.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">{otherUser.email}</p>
                      </div>
                      
                      {loan.status === 'pending' && (
                        <button
                          onClick={() => onSettleLoan(loan._id)}
                          className="btn-success text-sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Settle
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Loan Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Loan"
      >
        <form onSubmit={handleSubmit(onCreateLoan)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Borrower Email
            </label>
            <input
              {...register('borrowerEmail', {
                required: 'Borrower email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Invalid email address',
                },
              })}
              type="email"
              className="input"
              placeholder="Enter borrower's email"
            />
            {errors.borrowerEmail && (
              <p className="mt-1 text-sm text-danger-600">{errors.borrowerEmail.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              {...register('amount', {
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
            {errors.amount && (
              <p className="mt-1 text-sm text-danger-600">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason (Optional)
            </label>
            <input
              {...register('reason')}
              type="text"
              className="input"
              placeholder="What's this loan for?"
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
                  Creating...
                </div>
              ) : (
                'Create Loan'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Loans;