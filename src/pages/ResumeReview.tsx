import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '../components/Button';
import { ResumeReviewSection } from '../components/ResumeReviewSection';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/LoadingState';
import { ApiDebugPanel } from '../components/ApiDebugPanel';

export default function ResumeReview() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [debugMode, setDebugMode] = useState(false);
  const [apiResponses, setApiResponses] = useState<any[]>([]);

  // Function to capture API responses for debugging
  const captureApiResponse = (response: any) => {
    setApiResponses(prev => [response, ...prev].slice(0, 5)); // Keep the last 5 responses
  };

  const clearApiResponses = () => {
    setApiResponses([]);
  };

  // Keyboard shortcut for debug mode
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setDebugMode(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="ghost"
            size="sm"
            leftIcon={ArrowLeft}
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            Back to Dashboard
          </Button>
          
          {debugMode && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={FileText}
              onClick={() => setDebugMode(false)}
              className="text-green-400 bg-green-900/20"
            >
              Debug Mode: ON
            </Button>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="bg-[#FF8A00]/20 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-[#FF8A00]" />
              </div>
              <h1 className="text-3xl font-bold text-white">Resume Review</h1>
            </div>
            <p className="text-gray-400 text-sm max-w-2xl mt-2">
              Get AI-powered resume analysis, improvement suggestions, and impact statements based on your projects.
            </p>
          </div>
        </div>
        
        {user && <ResumeReviewSection 
          userId={user.id} 
          debugMode={debugMode}
          onApiResponse={captureApiResponse}
        />}
        
        {/* API Debug Panels */}
        {debugMode && (
          <div className="mt-8 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl text-white font-bold flex items-center">
                <FileText className="h-5 w-5 mr-2 text-[#FF8A00]" />
                API Debug Console
              </h2>
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearApiResponses}
                className="text-xs"
              >
                Clear All
              </Button>
            </div>
            
            {apiResponses.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
                <h3 className="text-lg font-medium text-white mb-1">No API Responses Yet</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Perform actions like analyzing your resume to see API responses here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {apiResponses.map((response, index) => (
                  <ApiDebugPanel 
                    key={index}
                    title={`API Call: ${response.endpoint || 'Unknown Endpoint'}`}
                    response={response}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}