import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  MessageSquare, 
  Calendar, 
  Award, 
  ChevronRight, 
  CheckCircle, 
  Clock,
  BarChart3 
} from 'lucide-react';
import { Card, CardContent } from '../Card';

interface InterviewHistoryCardProps {
  id: string;
  date: string;
  score?: number;
  competenciesAssessed?: string[];
  status: string;
  onClick: (id: string) => void;
}

export function InterviewHistoryCard({
  id,
  date,
  score,
  competenciesAssessed = [],
  status,
  onClick
}: InterviewHistoryCardProps) {
  // Format date relative to now (e.g., "2 days ago")
  const formattedDate = formatDistanceToNow(new Date(date), { addSuffix: true });
  
  // Determine status color and icon
  const getStatusInfo = () => {
    switch(status) {
      case 'completed':
        return { 
          color: 'bg-green-900/30 text-green-400 border-green-700/30',
          icon: <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
        };
      case 'in_progress':
        return { 
          color: 'bg-blue-900/30 text-blue-400 border-blue-700/30',
          icon: <Clock className="h-3.5 w-3.5 mr-1.5" /> 
        };
      default:
        return { 
          color: 'bg-gray-800 text-gray-400 border-gray-700/50',
          icon: <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
        };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  // Determine score color
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card 
      className="border border-gray-700 hover:border-[#FF8A00]/50 transition-all cursor-pointer"
      onClick={() => onClick(id)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 text-[#FF8A00] mr-2" />
                <h3 className="font-medium text-white">Mock Interview</h3>
              </div>
              
              <div className={`px-2 py-0.5 text-xs rounded-full flex items-center border ${statusInfo.color}`}>
                {statusInfo.icon}
                <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
              </div>
            </div>
            
            <div className="flex items-center text-sm text-gray-400">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              {formattedDate}
            </div>
            
            {competenciesAssessed && competenciesAssessed.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {competenciesAssessed.map(code => (
                  <span 
                    key={code}
                    className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded"
                  >
                    {code}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            {score !== undefined && score !== null ? (
              <div className="flex flex-col items-center mr-4">
                <div className="flex items-center">
                  <Award className="h-3.5 w-3.5 mr-1 text-[#FF8A00]" />
                  <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                    {score.toFixed(1)}
                  </span>
                </div>
                <span className="text-xs text-gray-500">Score</span>
              </div>
            ) : (
              <div className="flex flex-col items-center mr-4">
                <div className="flex items-center">
                  <BarChart3 className="h-3.5 w-3.5 mr-1 text-gray-500" />
                  <span className="text-lg font-bold text-gray-500">--</span>
                </div>
                <span className="text-xs text-gray-500">No Score</span>
              </div>
            )}
            
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}