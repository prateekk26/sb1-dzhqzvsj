import React, { useRef, useEffect } from 'react';
import { MessageSquare, User, Clock, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../Card';

interface QAPair {
  id: string;
  questionType: 'main' | 'follow-up';
  questionText: string;
  responseText: string;
  feedbackText?: string;
  timestamp: Date;
}

interface ConversationHistoryProps {
  qaPairs: QAPair[];
  sessionComplete: boolean;
  onNewInterviewClick?: () => void;
}

export function ConversationHistory({ 
  qaPairs, 
  sessionComplete,
  onNewInterviewClick
}: ConversationHistoryProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new items are added
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [qaPairs]);
  
  if (qaPairs.length === 0) {
    return null;
  }
  
  return (
    <Card className="border border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-[#FF8A00]" />
          Interview Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={scrollContainerRef}
          className="space-y-4 max-h-[400px] overflow-y-auto pr-2"
        >
          {qaPairs.map((pair, index) => {
            // Skip empty responses (for follow-up questions that haven't been answered yet)
            if (!pair.responseText && index !== qaPairs.length - 1) return null;
            
            return (
              <div key={pair.id} className="mb-2 pb-4 border-b border-gray-700 last:border-0 last:pb-0">
                <div className="flex items-start mb-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-1 
                    ${pair.questionType === 'main' 
                      ? 'bg-[#FF8A00]/20 text-[#FF8A00] border border-[#FF8A00]/40' 
                      : 'bg-blue-900/20 text-blue-400 border border-blue-500/40'}`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex gap-2 mb-1.5">
                      {pair.questionType === 'main' ? (
                        <span className="bg-[#FF8A00]/20 text-[#FF8A00] text-xs px-2 py-0.5 rounded-full">
                          Primary Question
                        </span>
                      ) : (
                        <span className="bg-blue-900/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">
                          Follow-up Question
                        </span>
                      )}
                      <span className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {new Date(pair.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-white font-medium mb-2">{pair.questionText}</p>
                    
                    {pair.responseText ? (
                      <div className="bg-gray-800 p-3 rounded-lg mb-2">
                        <div className="flex items-center mb-1 text-xs text-gray-400">
                          <User className="h-3 w-3 mr-1" />
                          Your response:
                        </div>
                        <p className="text-sm text-white">{pair.responseText}</p>
                      </div>
                    ) : (
                      <div className="bg-gray-800 p-3 rounded-lg mb-2 border border-gray-700/50">
                        <p className="text-sm text-gray-400 italic">Waiting for your response...</p>
                      </div>
                    )}
                    
                    {pair.feedbackText && (
                      <div className="bg-gray-800/40 p-3 rounded-lg border border-[#FF8A00]/20">
                        <p className="text-xs text-[#FF8A00] mb-1">Feedback:</p>
                        <p className="text-sm text-gray-300">{pair.feedbackText}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {sessionComplete && (
            <div className="mt-6 pt-4 border-t border-gray-700 text-center animate-fadeIn">
              <div className="bg-green-900/20 text-green-400 inline-flex items-center px-3 py-1.5 rounded-full mb-3">
                <CheckCircle className="h-4 w-4 mr-2" />
                Interview Complete!
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}