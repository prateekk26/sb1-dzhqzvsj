import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCheck } from 'lucide-react';
import { Button } from '../../components/Button';
import { ReferencesAdminPanel } from '../../components/admin/ReferencesAdminPanel';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/LoadingState';
import { useAdminStatus } from '../../hooks/useAdminStatus';

export default function AdminReferences() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminStatus();

  if (authLoading || adminLoading) {
    return <LoadingState />;
  }

  if (!user) {
    navigate('/');
    return null;
  }

  if (!isAdmin) {
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
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="bg-[#FF8A00]/20 p-2 rounded-lg">
                <UserCheck className="h-6 w-6 text-[#FF8A00]" />
              </div>
              <h1 className="text-3xl font-bold text-white">Reference Management</h1>
            </div>
            <p className="text-gray-400 text-sm max-w-2xl mt-2">
              Review and manage reference requests from candidates. Send requests and verify responses.
            </p>
          </div>
        </div>
        
        {/* Main Content */}
        <ReferencesAdminPanel />
      </div>
    </div>
  );
}