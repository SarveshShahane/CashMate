import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { groupApi, expenseApi, authApi } from '../../services/api';
import { Group, Expense, User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeft,
  Users, 
  Plus, 
  UserPlus,
  UserMinus,
  Receipt,
  Calendar,
  DollarSign,
  Trash2
} from 'lucide-react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import EmptyState from '../../components/UI/EmptyState';
import toast from 'react-hot-toast';

interface AddUserForm {
  email: string;
}

interface CreateExpenseForm {
  amount: number;
  description: string;
  splitBetween: string[];
}

const GroupDetail: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isCreateExpenseModalOpen, setIsCreateExpenseModalOpen] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const {
    register: registerUser,
    handleSubmit: handleUserSubmit,
    reset: resetUser,
    formState: { errors: userErrors },
  } = useForm<AddUserForm>();

  const {
    register: registerExpense,
    handleSubmit: handleExpenseSubmit,
    reset: resetExpense,
    formState: { errors: expenseErrors },
  } = useForm<CreateExpenseForm>({
    defaultValues: {
      amount: 0,
      description: '',
    }
  });

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails();
      fetchGroupExpenses();
    }
  }, [groupId]);

  const fetchGroupDetails = async () => {
    try {
      const response = await groupApi.getDetails(groupId!);
      setGroup(response.data.group);
      // Initialize selected members with all members
      setSelectedMembers(response.data.group.members.map(m => m._id));
    } catch (error) {
      toast.error('Failed to fetch group details');
    }
  };

  const fetchGroupExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await expenseApi.getByGroup(groupId!);
      setExpenses(response.data.expenses);
    } catch (error) {
      toast.error('Failed to fetch group expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const onAddUser = async (data: AddUserForm) => {
    setIsAddingUser(true);
    try {
      await groupApi.addUser(groupId!, data.email);
      toast.success('User added to group successfully');
      setIsAddUserModalOpen(false);
      resetUser();
      fetchGroupDetails();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to add user';
      toast.error(message);
    } finally {
      setIsAddingUser(false);
    }
  };

  const onRemoveUser = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to remove ${userName} from this group?`)) {
      try {
        await groupApi.removeUser(groupId!, userId);
        toast.success('User removed from group successfully');
        fetchGroupDetails();
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to remove user';
        toast.error(message);
      }
    }
  };

  // Remove console.logs and improve error feedback
  const onCreateExpense = async (data: CreateExpenseForm) => {
    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member to split the expense');
      return;
    }

    setIsCreatingExpense(true);
    try {
      const response = await expenseApi.create(
        groupId!, 
        Number(data.amount), 
        data.description, 
        selectedMembers
      );
      
      toast.success('Expense created successfully');
      setIsCreateExpenseModalOpen(false);
      resetExpense();
      setSelectedMembers(group?.members.map(m => m._id) || []);
      fetchGroupExpenses();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create expense. Please try again.';
      toast.error(message);
    } finally {
      setIsCreatingExpense(false);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  if (isLoading && !group) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Group not found</p>
        <Link to="/groups" className="btn-primary mt-4">
          Back to Groups
        </Link>
      </div>
    );
  }

  // Calculate total expenses and user's share
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const userTotalShare = expenses.reduce((sum, expense) => {
    const userSplit = expense.splitDetails.find(s => s.user._id === user?._id);
    return sum + (userSplit?.share || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/groups" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{group.groupName}</h1>
            <p className="text-gray-600">
              {group.members.length} member{group.members.length !== 1 ? 's' : ''} • 
              Created {new Date(group.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="btn-secondary"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </button>
          <button
            onClick={() => setIsCreateExpenseModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalExpenses.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Your Share</p>
                <p className="text-2xl font-bold text-warning-600">
                  ${userTotalShare.toFixed(2)}
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
                <p className="text-sm font-medium text-gray-600">Members</p>
                <p className="text-2xl font-bold text-success-600">
                  {group.members.length}
                </p>
              </div>
              <div className="p-3 bg-success-100 rounded-lg">
                <Users className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Members */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Members</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {group.members.map((member) => (
                  <div key={member._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    {member._id !== user?._id && (
                      <button
                        onClick={() => onRemoveUser(member._id, member.name)}
                        className="text-danger-600 hover:text-danger-700 p-1"
                        title="Remove member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
            </div>
            <div className="card-body">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : expenses.length === 0 ? (
                <EmptyState
                  icon={<Receipt className="w-12 h-12" />}
                  title="No expenses yet"
                  description="Add your first expense to start tracking group spending."
                  action={
                    <button
                      onClick={() => setIsCreateExpenseModalOpen(true)}
                      className="btn-primary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Expense
                    </button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {expenses.map((expense) => {
                    const userSplit = expense.splitDetails.find(s => s.user._id === user?._id);
                    return (
                      <div key={expense._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="p-2 bg-warning-100 rounded-lg">
                                <Receipt className="w-4 h-4 text-warning-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{expense.description}</h4>
                                <p className="text-sm text-gray-500">
                                  Paid by {expense.paidBy?.name || expense.createdBy.name} • {' '}
                                  {new Date(expense.date || expense.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="ml-11">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                                <span className="font-semibold text-gray-900">${expense.amount.toFixed(2)}</span>
                              </div>
                              {userSplit && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-600">Your Share:</span>
                                  <span className="font-semibold text-warning-600">${userSplit.share.toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Split Details */}
                        <div className="mt-3 ml-11">
                          <p className="text-xs font-medium text-gray-500 mb-2">SPLIT BETWEEN</p>
                          <div className="flex flex-wrap gap-1">
                            {expense.splitDetails.map((split) => (
                              <span
                                key={split.user._id}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                              >
                                {split.user.name}: ${split.share.toFixed(2)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Add Member to Group"
      >
        <form onSubmit={handleUserSubmit(onAddUser)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              {...registerUser('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Invalid email address',
                },
              })}
              type="email"
              className="input"
              placeholder="Enter user's email"
            />
            {userErrors.email && (
              <p className="mt-1 text-sm text-danger-600">{userErrors.email.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsAddUserModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAddingUser}
              className="btn-primary"
            >
              {isAddingUser ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Adding...
                </div>
              ) : (
                'Add Member'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Expense Modal */}
      <Modal
        isOpen={isCreateExpenseModalOpen}
        onClose={() => setIsCreateExpenseModalOpen(false)}
        title="Add New Expense"
        size="lg"
      >
        <form onSubmit={handleExpenseSubmit(onCreateExpense)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              {...registerExpense('description', {
                required: 'Description is required',
              })}
              type="text"
              className="input"
              placeholder="What was this expense for?"
            />
            {expenseErrors.description && (
              <p className="mt-1 text-sm text-danger-600">{expenseErrors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              {...registerExpense('amount', {
                required: 'Amount is required',
                min: {
                  value: 0.01,
                  message: 'Amount must be greater than 0',
                },
                valueAsNumber: true, // Ensure value is parsed as a number
              })}
              type="number"
              step="0.01"
              className="input"
              placeholder="0.00"
            />
            {expenseErrors.amount && (
              <p className="mt-1 text-sm text-danger-600">{expenseErrors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Split Between ({selectedMembers.length} selected)
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {group.members.map((member) => (
                <label key={member._id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member._id)}
                    onChange={() => toggleMemberSelection(member._id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateExpenseModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingExpense}
              className="btn-primary"
            >
              {isCreatingExpense ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </div>
              ) : (
                'Add Expense'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GroupDetail;