import React from 'react';
import { Sparkles, Award, CheckCircle, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../Card';
import { Button } from '../Button';
import { GradingResult, CompetencyScore } from '../../hooks/useInterviewGrading';

interface GradingResultsProps {
  results: GradingResult;
  onStartNew: () => void;
  onBack?: () => void;
}

export function GradingResults({ results, onStartNew, onBack }: GradingResultsProps) {
  // Determine score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-yellow-400";
    return "text-red-400";
  };
  
  // Get background color for score pill
  const getScoreBgColor = (score: number) => {
    if (score >= 8) return "bg-green-900/30 text-green-400 border-green-700/50";
    if (score >= 6) return "bg-yellow-900/30 text-yellow-400 border-yellow-700/50";
    return "bg-red-900/30 text-red-400 border-red-700/50";
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-[#FF8A00]" />
          <h1 className="text-3xl font-bold text-white">Interview Results</h1>
        </div>
        
        <div className="flex gap-2">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={ArrowLeft}
              onClick={onBack}
              className="text-gray-400"
            >
              Back
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            leftIcon={RefreshCw}
            onClick={onStartNew}
          >
            Start New Interview
          </Button>
        </div>
      </div>
      
      <Card className="border border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-[#FF8A00]" />
            Overall Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:justify-between items-center gap-6">
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
                    stroke={results.overallScore >= 8 ? "#34D399" : results.overallScore >= 6 ? "#FBBF24" : "#F87171"} 
                    strokeWidth="10" 
                    strokeDasharray={`${results.overallScore * 28.26} 282.6`} 
                    strokeDashoffset="0" 
                    strokeLinecap="round" 
                    transform="rotate(-90 50 50)" 
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className={`text-3xl font-bold ${getScoreColor(results.overallScore)}`}>
                    {results.overallScore.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">out of 10</span>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full border text-sm ${getScoreBgColor(results.overallScore)}`}>
                {results.overallScore >= 8 
                  ? 'Excellent' 
                  : results.overallScore >= 6 
                    ? 'Good' 
                    : 'Needs Improvement'}
              </div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 max-w-xl flex-1">
              <h3 className="text-lg font-medium text-white mb-2">Performance Summary</h3>
              <p className="text-gray-300 text-sm whitespace-pre-line">
                {results.summary}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Strengths and Areas for Improvement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
              Key Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <div className="text-green-400 mr-2 mt-1">•</div>
                  <div className="text-gray-300">{strength}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-400" />
              Areas to Improve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start">
                  <div className="text-yellow-400 mr-2 mt-1">•</div>
                  <div className="text-gray-300">{improvement}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      
      {/* Competency Scores */}
      <Card className="border border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-[#FF8A00]" />
            Competency Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.competencyScores.map((score, index) => (
              <div key={index} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="p-4">
                  <div className="flex flex-wrap justify-between items-center mb-2">
                    <div className="flex items-center mb-2 md:mb-0">
                      <span className="bg-[#FF8A00]/20 text-[#FF8A00] px-2 py-1 rounded-md text-sm font-mono mr-2">
                        {score.code}
                      </span>
                      <h3 className="text-white font-medium">{score.name}</h3>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreBgColor(score.score)}`}>
                      Score: {score.score.toFixed(1)}/10
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="bg-gray-700/50 rounded-lg p-3 mb-3">
                      <p className="text-gray-300 text-sm">
                        {score.feedback}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <h4 className="text-green-400 font-medium mb-1">Strengths:</h4>
                        <ul className="space-y-1">
                          {score.strengths.map((strength, i) => (
                            <li key={i} className="flex items-start">
                              <span className="text-green-400 mr-1">•</span>
                              <span className="text-gray-300">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-yellow-400 font-medium mb-1">Areas to Improve:</h4>
                        <ul className="space-y-1">
                          {score.improvements.map((improvement, i) => (
                            <li key={i} className="flex items-start">
                              <span className="text-yellow-400 mr-1">•</span>
                              <span className="text-gray-300">{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="border-t border-gray-700 pt-4">
          <Button
            variant="primary"
            onClick={onStartNew}
            leftIcon={RefreshCw}
            fullWidth
          >
            Start New Interview Session
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}