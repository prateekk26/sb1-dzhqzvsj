import React from 'react';
import { Award, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../Card';
import { Button } from '../Button';

interface SessionSummaryProps {
  competencyScore: number; // 1-5 scale
  strengths: string[];
  gaps: string[];
  feedback: string;
  onStartNew: () => void;
}

export function SessionSummary({ 
  competencyScore,
  strengths, 
  gaps, 
  feedback,
  onStartNew
}: SessionSummaryProps) {
  // Convert 1-5 score to a 1-10 scale for display
  const displayScore = competencyScore * 2;
  
  // Determine score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-yellow-400";
    return "text-red-400";
  };
  
  // Get label for score
  const getScoreLabel = (score: number) => {
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Good";
    return "Needs Improvement";
  };

  return (
    <Card className="border border-gray-700 animate-fadeIn">
      <CardHeader className="bg-gradient-to-r from-[#FF8A00]/10 to-transparent">
        <CardTitle className="flex items-center">
          <Award className="h-5 w-5 mr-2 text-[#FF8A00]" />
          Interview Session Complete
        </CardTitle>
      </CardHeader>
      <CardContent className="py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <svg className="w-32 h-32" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="#374151" 
                  strokeWidth="10" 
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke={displayScore >= 8 ? "#34D399" : displayScore >= 6 ? "#FBBF24" : "#F87171"} 
                  strokeWidth="10" 
                  strokeDasharray={`${displayScore * 28.26} 282.6`} 
                  strokeDashoffset="0" 
                  strokeLinecap="round" 
                  transform="rotate(-90 50 50)" 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className={`text-3xl font-bold ${getScoreColor(displayScore)}`}>
                  {displayScore.toFixed(1)}
                </span>
                <span className="text-xs text-gray-400">out of 10</span>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full ${getScoreColor(displayScore)} border border-${displayScore >= 8 ? 'green' : displayScore >= 6 ? 'yellow' : 'red'}-700/30 text-sm`}>
              {getScoreLabel(displayScore)}
            </div>
          </div>
          
          <div className="flex-1 bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-2">Feedback</h3>
            <p className="text-gray-300 text-sm whitespace-pre-line">
              {feedback}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <h3 className="text-green-400 font-medium mb-2 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Strengths
            </h3>
            <ul className="space-y-2">
              {strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  <span className="text-gray-300">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-yellow-400 font-medium mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Areas to Improve
            </h3>
            <ul className="space-y-2">
              {gaps.map((gap, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span className="text-gray-300">{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-gray-700 pt-4">
        <Button
          variant="primary"
          onClick={onStartNew}
          leftIcon={RefreshCw}
          fullWidth
        >
          Start New Interview
        </Button>
      </CardFooter>
    </Card>
  );
}