import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Trash2, Search, Filter, AlertTriangle, X, RefreshCw, UserX, ShieldAlert, CheckCircle, Clock, Calendar } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Alert } from '../../components/Alert';
import { LoadingState, LoadingSpinner, ContentLoading } from '../../components/LoadingState';
import { useAuth } from '../../context/AuthContext';
import { useAdminStatus } from '../../hooks/useAdminStatus';
import { supabase } from '../../lib/supabase';
import { Modal } from '../../components/Modal';
import { formatDistanceToNow } from 'date-fns';
import { getAuthToken } from '../../utils/auth';

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  linkedin_url: string | null;
  created_at: string;
  auth_email?: string;
  profile_completed?: boolean;
  last_sign_in_at?: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminStatus();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch all users
  useEffect(() => {
    async function fetchUsers() {
      if (!isAdmin) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching users as admin...');
        
        // Get auth token
        const token = await getAuthToken();
        console.log('Auth token available:', !!token);
        
        // Call the Edge Function to list users
        const { data, error } = await supabase.functions.invoke('admin-user-management', {
          body: { action: 'list' },
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (error) {
          console.error('Edge function error:', error);
          throw new Error(`Failed to fetch users: ${error.message}`);
        }
        
        if (!data.success) {
          console.error('Edge function returned error:', data.error);
          throw new Error(data.error || 'Failed to fetch users');
        }
        
        // Transform the data to match our expected format
        const mergedUsers = data.users.map((user: any) => ({
          id: user.profile?.id || user.id,
          user_id: user.id,
          first_name: user.profile?.first_name || null,
          last_name: user.profile?.last_name || null,
          email: user.profile?.email || null,
          linkedin_url: user.profile?.linkedin_url || null,
          created_at: user.profile?.created_at || user.created_at,
          auth_email: user.email,
          profile_completed: user.profile?.profile_completed || false,
          last_sign_in_at: user.last_sign_in_at || null
        }));
        
        setUsers(mergedUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, [isAdmin, refreshTrigger]);

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.first_name && user.first_name.toLowerCase().includes(searchLower)) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.auth_email && user.auth_email.toLowerCase().includes(searchLower))
    );
  });

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      // Get auth token
      const token = await getAuthToken();
      
      // Call the Edge Function to delete the user
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { 
          action: 'delete',
          userId: userToDelete.user_id
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (error) {
        throw new Error(`Failed to delete user: ${error.message}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete user');
      }
      
      // Update local state
      setUsers(prev => prev.filter(u => u.user_id !== userToDelete.user_id));
      setUserToDelete(null);
      setShowDeleteModal(false);
      setDeleteSuccess(`User ${userToDelete.first_name || userToDelete.auth_email || 'unknown'} has been permanently deleted`);
      
      // Refresh the list
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error deleting user:', err);
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  // Redirect if not admin
  if (authLoading || adminLoading) {
    return <LoadingState />;
  }

  if (!user) {
    console.log('No user found, redirecting to landing page');
    navigate('/');
    return null;
  }

  if (!isAdmin) {
    console.log('User is not an admin, redirecting to unauthorized page');
    navigate('/unauthorized');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0F121A]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Button 
          variant="ghost"
          size="sm"
          leftIcon={ArrowLeft}
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-white mb-6 transition-colors duration-200"
        >
          Back to Dashboard
        </Button>
        
        {/* Admin Access Banner */}
        <Alert 
          variant="success" 
          message="You are viewing this page with administrator access." 
          className="mb-4"
          icon={ShieldAlert}
        />
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="bg-red-900/20 p-2 rounded-lg">
                <UserX className="h-6 w-6 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold text-white">User Management</h1>
            </div>
            <p className="text-gray-400 text-sm max-w-2xl mt-2">
              Manage user accounts and delete user profiles. This is a destructive operation and cannot be undone.
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            leftIcon={RefreshCw}
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="text-blue-400 border-blue-500/30 hover:bg-blue-900/20"
          >
            Refresh
          </Button>
        </div>
        
        {/* Success/Error Messages */}
        {deleteSuccess && (
          <Alert
            variant="success"
            message={deleteSuccess}
            className="mb-4"
            onClose={() => setDeleteSuccess(null)}
          />
        )}
        
        {error && (
          <Alert
            variant="error"
            message={error}
            className="mb-4"
            onClose={() => setError(null)}
          />
        )}
        
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]/50 focus:border-transparent"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        
        {/* Users List */}
        <Card className="border border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-[#FF8A00]" />
              Users
              {!loading && (
                <span className="ml-2 text-sm text-gray-400">
                  ({filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ContentLoading 
                message="Loading users..." 
                icon={<Users className="h-8 w-8 text-[#FF8A00] animate-pulse" />} 
              />
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 bg-gray-800/50 rounded-lg border border-gray-700">
                <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No users found</h3>
                <p className="text-gray-400 mb-4">
                  {users.length === 0 
                    ? "There are no users in the system." 
                    : "No users match your search criteria."}
                </p>
                {users.length > 0 && searchTerm && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                    {filteredUsers.map((userProfile) => (
                      <tr key={userProfile.id} className="hover:bg-gray-750">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {userProfile.first_name && userProfile.last_name 
                                ? `${userProfile.first_name} ${userProfile.last_name}`
                                : 'Unnamed User'}
                            </div>
                            <div className="text-sm text-gray-400">ID: {userProfile.user_id.substring(0, 8)}...</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-300">{userProfile.auth_email || userProfile.email || 'No email'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            {userProfile.profile_completed ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-700/30">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Complete
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-700/30">
                                <Clock className="h-3 w-3 mr-1" />
                                Incomplete
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                          {formatDistanceToNow(new Date(userProfile.created_at), { addSuffix: true })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                          {userProfile.last_sign_in_at ? (
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1 text-blue-400" />
                              {formatDistanceToNow(new Date(userProfile.last_sign_in_at), { addSuffix: true })}
                            </span>
                          ) : (
                            <span className="text-gray-500">Never</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={Trash2}
                            onClick={() => {
                              setUserToDelete(userProfile);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-400 hover:bg-red-900/20"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteUser}
              isLoading={isDeleting}
            >
              Delete User
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-red-900/20 p-4 rounded-lg border border-red-500/30 flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-white font-medium mb-1">Permanent Deletion</h3>
              <p className="text-gray-300 text-sm">
                This action will permanently delete the user and all associated data. This cannot be undone.
              </p>
            </div>
          </div>
          
          {userToDelete && (
            <div>
              <p className="text-white mb-2">Are you sure you want to delete this user?</p>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="text-white font-medium">
                  {userToDelete.first_name && userToDelete.last_name 
                    ? `${userToDelete.first_name} ${userToDelete.last_name}`
                    : userToDelete.auth_email || 'Unnamed User'}
                </p>
                <p className="text-gray-400 text-sm">{userToDelete.auth_email || userToDelete.email || 'No email'}</p>
                <p className="text-gray-500 text-xs mt-1">User ID: {userToDelete.user_id}</p>
              </div>
            </div>
          )}
          
          {deleteError && (
            <Alert
              variant="error"
              message={deleteError}
              onClose={() => setDeleteError(null)}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}