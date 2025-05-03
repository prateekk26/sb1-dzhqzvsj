import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { TruthWallAdminPanel } from '../../components/admin/TruthWallAdminPanel';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/LoadingState';
import { useAdminStatus } from '../../hooks/useAdminStatus';

export default function AdminTruthWall() {
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
                <MessageCircle className="h-6 w-6 text-[#FF8A00]" />
              </div>
              <h1 className="text-3xl font-bold text-white">Truth Wall Management</h1>
            </div>
            <p className="text-gray-400 text-sm max-w-2xl mt-2">
              Review, approve, and manage anonymous interview experiences shared by users.
            </p>
          </div>
        </div>
        
        {/* Main Content */}
        <TruthWallAdminPanel />
      </div>
    </div>
  );
}