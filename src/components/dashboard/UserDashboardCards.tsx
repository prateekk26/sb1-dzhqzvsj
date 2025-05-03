import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Users, Calendar, BookOpen, ListChecks, FileText,
  MessageSquare, Sparkles, BarChart, Lightbulb, Waves
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../Card';
import { Button } from '../Button';
import { useFeature } from '../../context/ConfigContext';

interface UserDashboardCardsProps {
  interviewCount: number;
  lastScore: number | null;
}

// Memoize the UserDashboardCards component to prevent unnecessary re-renders
export const UserDashboardCards = memo(function UserDashboardCards({ 
  interviewCount, 
  lastScore 
}: UserDashboardCardsProps) {
  const navigate = useNavigate();
  const mockInterviewsEnabled = useFeature('mockInterviews');
  const resumeReviewEnabled = useFeature('resumeReview');
  const linkedInImportEnabled = useFeature('linkedInImport');
  
  // Determine score color based on value
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <>
      <Card className="border border-gray-700 hover:border-[#FF8A00]/30 transition-all duration-200 hover:shadow-md hover:shadow-[#FF8A00]/10">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-[#FF8A00]" />
            Work Experience
          </CardTitle>
          <CardDescription>
            Document your professional journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 mb-4">
            Add your work history and projects to showcase your experience and achievements.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/memory')}
            className="w-full"
          >
            Manage Experience
          </Button>
        </CardContent>
      </Card>

      {resumeReviewEnabled && (
        <Card className="border border-gray-700 hover:border-[#FF8A00]/30 transition-all duration-200 hover:shadow-md hover:shadow-[#FF8A00]/10">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-[#FF8A00]" />
              Resume Review
            </CardTitle>
            <CardDescription>
              Optimize your resume for success
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">
              Get AI-powered feedback on your resume and tailored suggestions for improvement.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/resume-review')}
              className="w-full"
            >
              Review Resume
            </Button>
          </CardContent>
        </Card>
      )}

      {mockInterviewsEnabled && (
        <Card className="border border-gray-700 hover:border-[#FF8A00]/30 transition-all duration-200 hover:shadow-md hover:shadow-[#FF8A00]/10">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-[#FF8A00]" />
              Mock Interview
            </CardTitle>
            <CardDescription>
              Practice makes perfect
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <BarChart className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm text-gray-400">Completed:</span>
              </div>
              <span className="text-white font-medium">{interviewCount}</span>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm text-gray-400">Last Score:</span>
              </div>
              <span className={`font-medium ${getScoreColor(lastScore)}`}>
                {lastScore !== null ? `${lastScore.toFixed(1)}/10` : 'N/A'}
              </span>
            </div>
            
            <Button
              variant="outline"
              onClick={() => navigate('/mock-interview')}
              className="w-full"
            >
              Start Practice
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border border-gray-700 hover:border-[#FF8A00]/30 transition-all duration-200 hover:shadow-md hover:shadow-[#FF8A00]/10">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Waves className="h-5 w-5 mr-2 text-blue-400" />
            Real-time AI Interview
          </CardTitle>
          <CardDescription>
            Premium voice conversation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 mb-4 border-l-2 border-blue-500 pl-3">
            Experience our premium real-time interview with natural voice interaction and dynamic follow-up questions.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/mock-interview-premium')}
            className="w-full"
          >
            Start Real-time Interview
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-gray-700 hover:border-[#FF8A00]/30 transition-all duration-200 hover:shadow-md hover:shadow-[#FF8A00]/10">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-[#FF8A00]" />
            Upcoming Interviews
          </CardTitle>
          <CardDescription>
            Track your real interviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 mb-4">
            Schedule and prepare for your upcoming job interviews with personalized prep materials.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/upcoming-interviews')}
            className="w-full"
          >
            Manage Interviews
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-gray-700 hover:border-[#FF8A00]/30 transition-all duration-200 hover:shadow-md hover:shadow-[#FF8A00]/10">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-[#FF8A00]" />
            References
          </CardTitle>
          <CardDescription>
            Showcase your professional network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 mb-4">
            Request and manage professional references from colleagues and managers.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/references')}
            className="w-full"
          >
            Manage References
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-gray-700 hover:border-[#FF8A00]/30 transition-all duration-200 hover:shadow-md hover:shadow-[#FF8A00]/10">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-[#FF8A00]" />
            Interview History
          </CardTitle>
          <CardDescription>
            Track your progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 mb-4">
            Review your past mock interviews, see your improvement over time, and identify areas to focus on.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/interview-history')}
            className="w-full"
          >
            View History
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-gray-700 hover:border-[#FF8A00]/30 transition-all duration-200 hover:shadow-md hover:shadow-[#FF8A00]/10">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-[#FF8A00]" />
            Interview Assistant
          </CardTitle>
          <CardDescription>
            AI-powered response generator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 mb-4">
            Generate personalized interview responses based on your work history and professional background.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/interview-assistant')}
            className="w-full"
          >
            Create Responses
          </Button>
        </CardContent>
      </Card>
    </>
  );
});