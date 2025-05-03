import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader, AlertCircle, Award } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/LoadingState';
import { ProcessingIndicator } from '../components/LoadingIndicator';
import { supabase } from '../lib/supabase';
import { GradingResults } from '../components/interview/GradingResults';
import { Alert } from '../components/Alert';

interface InterviewResult {
  id: string;
  competency_scores: any;
  overall_score: number;
  feedback: string;
  transcript: string;
  created_at: string;
  audio_url?: string;
}

export default function MockInterviewResults() {
  const navigate = useNavigate();
  const { interviewId } = useParams();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interviewResult, setInterviewResult] = useState<InterviewResult | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingSteps = [
    { name: 'Retrieving interview data', description: 'Fetching your interview session' },
    { name: 'Loading analysis results', description: 'Preparing competency scores and feedback' },
    { name: 'Finalizing report', description: 'Generating your interview performance report' }
  ];
  
  // Fetch interview results
  useEffect(() => {
    async function fetchInterviewResult() {
      if (!user?.id || !interviewId) return;
      
      // Start loading process
      setLoadingStep(0);
      
      // Simulate step progression
      const stepInterval = setInterval(() => {
        setLoadingStep(prev => {
          if (prev >= loadingSteps.length - 1) {
            clearInterval(stepInterval);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
      try {
        const { data, error } = await supabase
          .from('mock_interviews')
          .select('id, competency_scores, overall_score, feedback, transcript, created_at, audio_url')
          .eq('id', interviewId)
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setInterviewResult(data);
        } else {
          setError('Interview not found');
        }
      } catch (err) {
        console.error('Error fetching interview result:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch interview result');
      } finally {
        setLoading(false);
        clearInterval(stepInterval);
        setLoadingStep(loadingSteps.length - 1);
      }
    }
    
    fetchInterviewResult();
  }, [user?.id, interviewId]);
  
  const handleStartNewInterview = () => {
    navigate('/mock-interview-premium');
  };
  
  if (authLoading) {
    return <LoadingState text="Loading..." />;
  }
  
  if (!user) {
    navigate('/');
    return null;
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F121A]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button 
            variant="ghost"
            size="sm"
            leftIcon={ArrowLeft}
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white mb-6"
          >
            Back to Dashboard
          </Button>
          
          <div className="mt-8">
            <ProcessingIndicator
              title="Loading Interview Results"
              steps={loadingSteps}
              currentStep={loadingStep}
              className="border border-gray-700 max-w-2xl mx-auto"
            />
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !interviewResult) {
    return (
      <div className="min-h-screen bg-[#0F121A]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button 
            variant="ghost"
            size="sm"
            leftIcon={ArrowLeft}
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white mb-6"
          >
            Back to Dashboard
          </Button>
          
          <div className="flex justify-center items-center pt-8">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-md text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl text-white font-bold mb-2">
                {error || 'Interview Not Found'}
              </h2>
              <p className="text-gray-300 mb-6">
                We couldn't find this interview or you may not have permission to view it.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  leftIcon={ArrowLeft}
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="primary"
                  onClick={handleStartNewInterview}
                >
                  Start New Interview
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If there are no proper competency scores, show an error
  if (!interviewResult.competency_scores || 
      !interviewResult.competency_scores.competencyScores || 
      interviewResult.competency_scores.competencyScores.length === 0) {
    return (
      <div className="min-h-screen bg-[#0F121A]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button 
            variant="ghost"
            size="sm"
            leftIcon={ArrowLeft}
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white mb-6"
          >
            Back to Dashboard
          </Button>
          
          <Alert
            variant="warning"
            title="Incomplete Interview Data"
            message="This interview doesn't have complete scoring data. This could be due to an early termination or technical issue during the interview process."
            className="mb-6"
          />
          
          <div className="flex justify-center">
            <Button
              variant="primary"
              onClick={handleStartNewInterview}
              leftIcon={Award}
            >
              Start New Interview
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Render the grading results
  return (
    <div className="min-h-screen bg-[#0F121A]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button 
          variant="ghost"
          size="sm"
          leftIcon={ArrowLeft}
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-white mb-6"
        >
          Back to Dashboard
        </Button>
        
        <GradingResults 
          results={interviewResult.competency_scores}
          onStartNew={handleStartNewInterview}
        />
        
        {/* Audio playback if available */}
        {interviewResult.audio_url && (
          <div className="mt-6">
            <Card className="border border-gray-700">
              <CardHeader>
                <CardTitle>Interview Recording</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-gray-300">Listen to your interview recording to further identify areas for improvement:</p>
                <audio controls className="w-full" src={interviewResult.audio_url}>
                  Your browser does not support the audio element.
                </audio>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}