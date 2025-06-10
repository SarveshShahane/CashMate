import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { expenseApi } from '../../services/api';
import { Expense } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Receipt, 
  Calendar,
  Users,
  DollarSign,
  ExternalLink
} from 'lucide-react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import EmptyState from '../../components/UI/EmptyState';
import toast from 'react-hot-toast';

const Expenses: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await expenseApi.getAll();
      setExpenses(response.data.expenses);
    } catch (error) {
      toast.error('Failed to fetch expenses');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary statistics
  const totalExpenses = expenses.reduce((sum, expense) => {
    const userSplit = expense.splitDetails.find(s => s.user._id === user?._id);
    return sum + (userSplit?.share || 0);
  }, 0);

  const totalPaid = expenses
    .filter(expense => expense.createdBy._id === user?._id)
    .reduce((sum, expense) => sum + expense.amount, 0);

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
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600">Track your shared expenses across all groups</p>
        </div>
        <Link to="/groups" className="btn-primary">
          <Users className="w-4 h-4 mr-2" />
          Manage Groups
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Your Total Share</p>
                <p className="text-2xl font-bold text-warning-600">
                  ${totalExpenses.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-warning-100 rounded-lg">
                <Receipt className="w-6 h-6 text-warning-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid by You</p>
                <p className="text-2xl font-bold text-success-600">
                  ${totalPaid.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-success-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Balance</p>
                <p className={`text-2xl font-bold ${
                  (totalPaid - totalExpenses) >= 0 
                    ? 'text-success-600' 
                    : 'text-danger-600'
                }`}>
                  ${(totalPaid - totalExpenses).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-12 h-12" />}
          title="No expenses yet"
          description="Join a group and start adding expenses to track your shared spending."
          action={
            <Link to="/groups" className="btn-primary">
              <Users className="w-4 h-4 mr-2" />
              Browse Groups
            </Link>
          }
        />
      ) : (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">All Expenses</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {expenses.map((expense) => {
              const userSplit = expense.splitDetails.find(s => s.user._id === user?._id);
              const isPaidByUser = expense.createdBy._id === user?._id;
              
              return (
                <div key={expense._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-3 bg-warning-100 rounded-lg">
                        <Receipt className="w-5 h-5 text-warning-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{expense.description}</h4>
                          <Link
                            to={`/groups/${expense.group._id}`}
                            className="text-primary-600 hover:text-primary-700"
                            title="View group"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {expense.group.groupName}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(expense.date || expense.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <p>
                            Paid by {expense.paidBy?.name || expense.createdBy.name}
                            {isPaidByUser && <span className="text-success-600 font-medium"> (You)</span>}
                          </p>
                        </div>

                        {/* Split Details */}
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">SPLIT BETWEEN</p>
                          <div className="flex flex-wrap gap-1">
                            {expense.splitDetails.map((split) => (
                              <span
                                key={split.user._id}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                  split.user._id === user?._id
                                    ? 'bg-primary-100 text-primary-800 font-medium'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {split.user._id === user?._id ? 'You' : split.user.name}: ${split.share.toFixed(2)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="space-y-1">
                        <div>
                          <p className="text-xs text-gray-500">Total Amount</p>
                          <p className="font-bold text-gray-900">${expense.amount.toFixed(2)}</p>
                        </div>
                        {userSplit && (
                          <div>
                            <p className="text-xs text-gray-500">Your Share</p>
                            <p className="font-bold text-warning-600">${userSplit.share.toFixed(2)}</p>
                          </div>
                        )}
                        {isPaidByUser && (
                          <div className="mt-2">
                            <span className="badge-success">You paid</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;