import React, { useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../Card';
import { Button } from '../Button';
import { Mic, UserSquare2, Sparkles, RotateCw } from 'lucide-react';
import { ConnectionStatus } from '../../hooks/useInterviewReducer';

interface UserResponseCardProps {
  status: ConnectionStatus;
  currentTranscript: string;
  feedback: string | null;
  connected: boolean;
  connecting: boolean;
  isInterviewActive: boolean;
  sessionId: string;
  onEndInterview: () => void;
}

export function UserResponseCard({
  status,
  currentTranscript,
  feedback,
  connected,
  connecting,
  isInterviewActive,
  sessionId,
  onEndInterview
}: UserResponseCardProps) {
  // For transcript UI
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll transcript container
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [currentTranscript]);
  
  return (
    <Card className="border border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mic className="h-5 w-5 mr-2 text-[#FF8A00]" />
          Your Response
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Status Indicators */}
        <div className="mb-4 flex flex-wrap gap-2 justify-center">
          {status === 'connecting' && (
            <span className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm flex items-center">
              <RotateCw className="h-3 w-3 mr-2 animate-spin" />
              Connecting to interview service...
            </span>
          )}
          
          {status === 'ready' && (
            <span className="px-3 py-1 bg-green-900/30 text-green-300 rounded-full text-sm flex items-center">
              <Sparkles className="h-3 w-3 mr-2" />
              Ready to begin
            </span>
          )}
          
          {status === 'active' && (
            <span className="px-3 py-1 bg-red-900/30 text-red-300 rounded-full text-sm flex items-center">
              <span className="h-3 w-3 bg-red-500 rounded-full animate-pulse mr-2"></span>
              Listening...
            </span>
          )}
          
          {status === 'thinking' && (
            <span className="px-3 py-1 bg-yellow-900/30 text-yellow-300 rounded-full text-sm flex items-center">
              <RotateCw className="h-3 w-3 mr-2 animate-spin" />
              Processing response...
            </span>
          )}
          
          {status === 'feedback' && (
            <span className="px-3 py-1 bg-green-900/30 text-green-300 rounded-full text-sm flex items-center">
              <Sparkles className="h-3 w-3 mr-2" />
              Feedback received
            </span>
          )}
        </div>
        
        {/* Transcript Display */}
        <div 
          ref={transcriptContainerRef}
          className={`p-4 bg-gray-800 rounded-lg border ${
            status === 'active' ? 'border-red-500/40' : 'border-gray-700'
          } max-h-60 overflow-auto mb-4`}
        >
          <h3 className="text-white font-medium mb-2 flex items-center">
            <UserSquare2 className="h-4 w-4 mr-2 text-gray-400" />
            Your Response:
          </h3>
          {currentTranscript ? (
            <p className="text-gray-300 whitespace-pre-line">{currentTranscript}</p>
          ) : (
            <p className="text-gray-500 italic">
              {connected 
                ? status === 'active'
                  ? 'Listening... Audio is being captured automatically.' 
                  : 'Waiting for the interview to begin...' 
                : 'Connect to the interview service to begin'
              }
            </p>
          )}
        </div>
        
        {/* Feedback Display */}
        {feedback && (
          <div className="p-4 bg-gray-800 rounded-lg border border-[#FF8A00]/40 animate-fadeIn">
            <h3 className="text-white font-medium mb-2 flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-[#FF8A00]" />
              AI Feedback:
            </h3>
            <p className="text-gray-300 whitespace-pre-line">{feedback}</p>
          </div>
        )}
      </CardContent>
      
      {/* Footer with session info and controls */}
      {(connected || connecting) && (
        <CardFooter className="border-t border-gray-700 p-4 flex justify-between items-center">
          <div>
            <span className="text-xs text-gray-400">
              Session ID: {sessionId.substring(0, 8)}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onEndInterview}
          >
            End Interview
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}