import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/LoadingState';
import { AiInterviewAssistant } from '../components/AiInterviewAssistant';

export default function InterviewAssistant() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return <LoadingState />;
  }

  if (!user) {
    navigate('/');
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
                <Sparkles className="h-6 w-6 text-[#FF8A00]" />
              </div>
              <h1 className="text-3xl font-bold text-white">Interview Response Assistant</h1>
            </div>
            <p className="text-gray-400 text-sm max-w-2xl mt-2">
              Generate personalized interview responses based on your work history, projects, and professional background.
            </p>
          </div>
        </div>
        
        {/* Main Content */}
        <AiInterviewAssistant userId={user.id} />
      </div>
    </div>
  );
}