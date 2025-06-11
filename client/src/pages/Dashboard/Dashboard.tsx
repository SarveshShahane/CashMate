import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { transactionApi, expenseApi, loanApi } from '../../services/api';
import { Transaction, Expense, Loan } from '../../types';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Receipt, 
  Banknote,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [transactionsRes, expensesRes, loansRes] = await Promise.all([
          transactionApi.getAll(),
          expenseApi.getAll(),
          loanApi.getAll(),
        ]);

        setTransactions(transactionsRes.data.transactions.slice(0, 5)); // Latest 5
        setExpenses(expensesRes.data.expenses.slice(0, 5)); // Latest 5
        setLoans(loansRes.data.loans.slice(0, 5)); // Latest 5
      } catch (error) {
        // Silently handle error - no console logs
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate summary statistics
  const totalSent = transactions
    .filter(t => t.sender._id === user?._id)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReceived = transactions
    .filter(t => t.receiver._id === user?._id)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = expenses.reduce((sum, e) => {
    const userSplit = e.splitDetails.find(s => s.user._id === user?._id);
    return sum + (userSplit?.share || 0);
  }, 0);

  const totalLoansGiven = loans
    .filter(l => l.lender._id === user?._id && l.status === 'pending')
    .reduce((sum, l) => sum + l.amount, 0);

  const totalLoansTaken = loans
    .filter(l => l.borrower._id === user?._id && l.status === 'pending')
    .reduce((sum, l) => sum + l.amount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's an overview of your financial activity
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Money Sent</p>
                <p className="text-2xl font-bold text-danger-600">
                  ${totalSent.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-danger-100 rounded-lg">
                <ArrowUpRight className="w-6 h-6 text-danger-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Money Received</p>
                <p className="text-2xl font-bold text-success-600">
                  ${totalReceived.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-success-100 rounded-lg">
                <ArrowDownLeft className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
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
                <p className="text-sm font-medium text-gray-600">Net Balance</p>
                <p className={`text-2xl font-bold ${
                  (totalReceived - totalSent - totalLoansTaken + totalLoansGiven) >= 0 
                    ? 'text-success-600' 
                    : 'text-danger-600'
                }`}>
                  ${(totalReceived - totalSent - totalLoansTaken + totalLoansGiven).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loans Summary */}
      {(totalLoansGiven > 0 || totalLoansTaken > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">You're Owed</p>
                  <p className="text-2xl font-bold text-success-600">
                    ${totalLoansGiven.toFixed(2)}
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
                    ${totalLoansTaken.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-danger-100 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-danger-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          </div>
          <div className="card-body">
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No transactions yet</p>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => {
                  const isSender = transaction.sender._id === user?._id;
                  return (
                    <div key={transaction._id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          isSender ? 'bg-danger-100' : 'bg-success-100'
                        }`}>
                          {isSender ? (
                            <ArrowUpRight className="w-4 h-4 text-danger-600" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4 text-success-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {isSender ? transaction.receiver.name : transaction.sender.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {transaction.description || 'No description'}
                          </p>
                        </div>
                      </div>
                      <p className={`font-semibold ${
                        isSender ? 'text-danger-600' : 'text-success-600'
                      }`}>
                        {isSender ? '-' : '+'}${transaction.amount.toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
          </div>
          <div className="card-body">
            {expenses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No expenses yet</p>
            ) : (
              <div className="space-y-4">
                {expenses.map((expense) => {
                  const userSplit = expense.splitDetails.find(s => s.user._id === user?._id);
                  return (
                    <div key={expense._id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-warning-100 rounded-lg">
                          <Receipt className="w-4 h-4 text-warning-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{expense.description}</p>
                          <p className="text-sm text-gray-500">{expense.group.groupName}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-warning-600">
                        ${userSplit?.share.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;