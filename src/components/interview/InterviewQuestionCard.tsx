import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../Card';
import { Button } from '../Button';
import { RefreshCw, Waves } from 'lucide-react';
import { InterviewQuestion } from '../../hooks/useInterviewQuestions';

interface InterviewQuestionCardProps {
  currentQuestion: InterviewQuestion | null;
  followUpQuestion: string | null;
  currentTranscript: string;
  status: string;
  connected: boolean;
  connecting: boolean;
  isGeneratingResponse: boolean;
  onRefresh: () => void;
  onConnect: () => void;
}

export function InterviewQuestionCard({
  currentQuestion,
  followUpQuestion,
  currentTranscript,
  status,
  connected,
  connecting,
  isGeneratingResponse,
  onRefresh,
  onConnect
}: InterviewQuestionCardProps) {
  return (
    <Card className="border border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Interview Question</span>
          <div className="flex items-center gap-2">
            {connected ? (
              <Button
                variant="outline"
                size="sm"
                leftIcon={RefreshCw}
                onClick={onRefresh}
                disabled={isGeneratingResponse || status === 'active'}
                className="text-xs"
              >
                New Question
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                leftIcon={Waves}
                onClick={onConnect}
                isLoading={connecting}
                className="text-xs"
              >
                {connecting ? 'Connecting...' : 'Start Connection'}
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Display current question or follow-up question */}
        <p className="text-gray-300">
          {followUpQuestion || 
           (currentQuestion ? 
            currentQuestion.question : 
            'Please connect to start the interview')}
        </p>
        
        {/* Show previous response context when displaying a follow-up question */}
        {followUpQuestion && currentTranscript && (
          <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center text-sm text-gray-400 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 mr-2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Previous Response
            </div>
            <p className="text-sm text-gray-300">
              {currentTranscript}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}