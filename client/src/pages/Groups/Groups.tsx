import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { groupApi } from '../../services/api';
import { Group } from '../../types';
import { useForm } from 'react-hook-form';
import { 
  Plus, 
  Users, 
  Calendar,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import EmptyState from '../../components/UI/EmptyState';
import toast from 'react-hot-toast';

interface GroupForm {
  name: string;
}

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GroupForm>();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await groupApi.getAll();
      setGroups(response.data.groups);
    } catch (error) {
      toast.error('Failed to fetch groups');
    } finally {
      setIsLoading(false);
    }
  };

  const onCreateGroup = async (data: GroupForm) => {
    setIsCreating(true);
    try {
      await groupApi.create(data.name);
      toast.success('Group created successfully');
      setIsCreateModalOpen(false);
      reset();
      fetchGroups();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create group';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-600">Manage your expense groups</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </button>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No groups yet"
          description="Create your first group to start sharing expenses with friends and family."
          action={
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Link
              key={group._id}
              to={`/groups/${group._id}`}
              className="card hover:shadow-medium transition-shadow cursor-pointer"
            >
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <Users className="w-5 h-5 text-primary-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {group.groupName}
                      </h3>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <UserPlus className="w-4 h-4 mr-2" />
                        {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        Created {new Date(group.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Members Preview */}
                    <div className="mt-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">MEMBERS</p>
                      <div className="flex flex-wrap gap-1">
                        {group.members.slice(0, 3).map((member) => (
                          <span
                            key={member._id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                          >
                            {member.name}
                          </span>
                        ))}
                        {group.members.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                            +{group.members.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Group"
      >
        <form onSubmit={handleSubmit(onCreateGroup)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              {...register('name', {
                required: 'Group name is required',
                minLength: {
                  value: 2,
                  message: 'Group name must be at least 2 characters',
                },
              })}
              type="text"
              className="input"
              placeholder="Enter group name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-danger-600">{errors.name.message}</p>
            )}
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
                'Create Group'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Groups;