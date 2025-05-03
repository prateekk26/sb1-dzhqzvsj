import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, BarChart3, Award, Plus, RefreshCw, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LoadingState, LoadingSpinner } from '../components/LoadingState';
import { useInterviewResults } from '../hooks/useInterviewResults';
import { InterviewHistoryCard } from '../components/interview/InterviewHistoryCard';
import { Alert } from '../components/Alert';

export default function InterviewHistory() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { 
    results, 
    loading: resultsLoading,
    error,
    fetchInterviewResults,
    getOverallAverageScore
  } = useInterviewResults(user?.id || null);

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    navigate('/');
    return null;
  }

  const handleRetry = () => {
    fetchInterviewResults();
  };

  const averageScore = getOverallAverageScore();
  const completedInterviews = results.filter(r => r.status === 'completed' || r.grading_status === 'completed');
  const inProgressInterviews = results.filter(r => r.status === 'in_progress');

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-[#0F121A]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Button 
          variant="ghost"
          size="sm"
          leftIcon={ArrowLeft}
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-white mb-6"
        >
          Back to Dashboard
        </Button>
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="bg-[#FF8A00]/20 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-[#FF8A00]" />
              </div>
              <h1 className="text-3xl font-bold text-white">Interview History</h1>
            </div>
            <p className="text-gray-400 text-sm max-w-2xl mt-2">
              Track your mock interview performance over time and see your progress.
            </p>
          </div>
          
          <Button
            variant="outline"
            leftIcon={Plus}
            onClick={() => navigate('/mock-interview')}
          >
            New Interview
          </Button>
        </div>
        
        {resultsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
            <RefreshCw className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-white mb-2">Error Loading History</h2>
            <p className="text-gray-400 mb-4">
              {error}
            </p>
            <Button onClick={handleRetry}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            {results.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="border border-gray-700">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-4 w-4 text-[#FF8A00]" />
                      <span className="text-sm font-medium text-gray-400">Total Interviews</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-white">{results.length}</span>
                      {results.length > 0 && (
                        <span className="text-sm text-gray-500 ml-2">
                          ({completedInterviews.length} completed)
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
                
                <Card className="border border-gray-700">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="h-4 w-4 text-[#FF8A00]" />
                      <span className="text-sm font-medium text-gray-400">Average Score</span>
                    </div>
                    <div className="flex items-center">
                      {averageScore ? (
                        <span className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
                          {averageScore.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-2xl font-bold text-gray-500">--</span>
                      )}
                      <span className="text-sm text-gray-500 ml-2">out of 10</span>
                    </div>
                  </div>
                </Card>
                
                <Card className="border border-gray-700">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="h-4 w-4 text-[#FF8A00]" />
                      <span className="text-sm font-medium text-gray-400">Progress</span>
                    </div>
                    <div className="flex items-center">
                      {results.length > 0 ? (
                        <div className="w-full">
                          <div className="w-full bg-gray-700 rounded-full h-2.5">
                            <div 
                              className="bg-[#FF8A00] h-2.5 rounded-full" 
                              style={{ width: `${Math.min(100, results.length * 10)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Beginner</span>
                            <span>Experienced</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Not enough data</span>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            )}
            
            {/* Interview Results List */}
            {results.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
                <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h2 className="text-xl font-medium text-white mb-2">No interview history yet</h2>
                <p className="text-gray-400 mb-6">
                  Complete your first mock interview to see your results and track your progress over time.
                </p>
                <Button
                  onClick={() => navigate('/mock-interview')}
                  leftIcon={Plus}
                >
                  Start Your First Interview
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Recent Interviews</h2>
                
                {inProgressInterviews.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-blue-400 text-sm uppercase font-medium mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      In Progress
                    </h3>
                    <div className="space-y-3">
                      {inProgressInterviews.map(interview => (
                        <InterviewHistoryCard
                          key={interview.id}
                          id={interview.id}
                          date={interview.created_at}
                          status={interview.status}
                          competenciesAssessed={interview.competencies_assessed || []}
                          onClick={(id) => navigate(`/mock-interview/${id}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {completedInterviews.length > 0 && (
                  <div>
                    <h3 className="text-green-400 text-sm uppercase font-medium mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Completed
                    </h3>
                    <div className="space-y-3">
                      {completedInterviews.map(interview => (
                        <InterviewHistoryCard
                          key={interview.id}
                          id={interview.id}
                          date={interview.created_at}
                          score={interview.overall_score || undefined}
                          status={interview.status}
                          competenciesAssessed={interview.competencies_assessed || []}
                          onClick={(id) => navigate(`/mock-interview-results/${id}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}