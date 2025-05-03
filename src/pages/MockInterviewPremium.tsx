import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mic, 
  Volume2, 
  Waves, 
  MessageSquare, 
  Send, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/Card';
import { Alert } from '../components/Alert';
import { TextArea } from '../components/TextArea';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/LoadingState';
import { useRealtimeInterview } from '../hooks/useRealtimeInterview';
import { ConnectionStatusCards } from '../components/interview/ConnectionStatusCards';

export default function MockInterviewPremium() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  // State for the interview
  const [inputText, setInputText] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'ai' | 'user', text: string}>>([]);
  
  // Use our custom hook for the realtime interview
  const {
    connect,
    disconnect,
    sendText,
    sendResponseTrigger,
    sessionId,
    isListening,
    connectionState,
    status,
    transcript,
    feedback,
    error,
    remoteAudioRef
  } = useRealtimeInterview({
    onTranscript: (text) => {
      console.log('Transcript updated:', text);
    },
    onFinalTranscript: (text) => {
      // Add user message to conversation history
      if (text.trim()) {
        setConversationHistory(prev => [...prev, { role: 'user', text }]);
      }
    },
    onFeedback: (text) => {
      console.log('Feedback received:', text);
      // Add AI message to conversation history
      if (text.trim()) {
        setConversationHistory(prev => [...prev, { role: 'ai', text }]);
      }
    },
    onFollowUp: (text) => {
      console.log('Follow-up received:', text);
      // Add AI follow-up to conversation history
      if (text.trim()) {
        setConversationHistory(prev => [...prev, { role: 'ai', text }]);
      }
    },
    onError: (message) => {
      console.error('Interview error:', message);
      setErrorMessage(message);
    },
    onStatusChange: (newStatus) => {
      switch (newStatus) {
        case 'connecting':
          setStatusMessage('Connecting to interview service...');
          break;
        case 'ready':
          setStatusMessage('Connected! The interviewer will begin shortly.');
          break;
        case 'active':
          setStatusMessage('Listening to your response...');
          break;
        case 'thinking':
          setStatusMessage('Processing your response...');
          break;
        case 'feedback':
          setStatusMessage('Feedback received.');
          break;
        case 'error':
          setStatusMessage('Error occurred during the interview.');
          break;
      }
    }
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [authLoading, user, navigate]);
  
  // Handle errors from the hook
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);
  
  // Start the interview
  const handleStartInterview = async () => {
    setErrorMessage(null);
    setInterviewStarted(true);
    setConversationHistory([]);
    
    try {
      await connect();
    } catch (err) {
      console.error('Failed to start interview:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to start interview');
      setInterviewStarted(false);
    }
  };
  
  // End the interview
  const handleEndInterview = () => {
    disconnect();
    setInterviewStarted(false);
  };
  
  // Send text input
  const handleSendText = async () => {
    if (!inputText.trim()) return;
    
    try {
      await sendText(inputText.trim());
      // Add user message to conversation history immediately
      setConversationHistory(prev => [...prev, { role: 'user', text: inputText.trim() }]);
      setInputText('');
      
      // Trigger response after sending text
      await sendResponseTrigger();
    } catch (err) {
      console.error('Error sending text:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send message');
    }
  };
  
  // Toggle text input mode
  const toggleTextInput = () => {
    setShowTextInput(!showTextInput);
  };

  if (authLoading) {
    return <LoadingState />;
  }

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
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="bg-blue-900/20 p-2 rounded-lg">
                <Waves className="h-6 w-6 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">Real-time AI Interview</h1>
            </div>
            <p className="text-gray-400 text-sm max-w-2xl mt-2">
              Practice with our AI interviewer using natural voice conversation. Get real-time feedback on your responses.
            </p>
          </div>
        </div>
        
        {/* Connection Status */}
        {interviewStarted && (
          <ConnectionStatusCards 
            connected={connectionState === 'connected'} 
            microphoneActive={isListening} 
            speakerActive={!!feedback}
          />
        )}
        
        {/* Error Message */}
        {errorMessage && (
          <Alert
            variant="error"
            message={errorMessage}
            onClose={() => setErrorMessage(null)}
            className="mb-6"
          />
        )}
        
        {/* Status Message */}
        {statusMessage && (
          <Alert
            variant="info"
            message={statusMessage}
            className="mb-6"
          />
        )}
        
        {!interviewStarted ? (
          /* Start Interview Button */
          <div className="flex flex-col items-center justify-center py-12 bg-gray-800/30 rounded-lg border border-gray-700 mb-6">
            <div className="text-center max-w-md mb-8">
              <Waves className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Ready for Your Interview?</h2>
              <p className="text-gray-300 mb-6">
                This premium feature uses AI to conduct a realistic interview with voice interaction. 
                You'll receive real-time feedback on your responses.
              </p>
              <div className="flex flex-col gap-2 text-sm text-gray-400 mb-6">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  <span>Natural voice conversation</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  <span>Personalized follow-up questions</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  <span>Detailed feedback on your responses</span>
                </div>
              </div>
            </div>
            
            <Button
              variant="primary"
              size="lg"
              leftIcon={Waves}
              onClick={handleStartInterview}
              className="px-8 py-6"
            >
              Start Interview
            </Button>
          </div>
        ) : (
          /* Interview Interface */
          <div className="space-y-6">
            {/* Conversation History */}
            <Card className="border border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-blue-400" />
                    Interview Conversation
                  </div>
                  {status === 'active' && (
                    <div className="flex items-center text-red-400 animate-pulse">
                      <Mic className="h-4 w-4 mr-1 animate-pulse" />
                      <span className="text-xs">Listening...</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-800 rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto border border-gray-700">
                  {conversationHistory.length > 0 ? (
                    <div className="space-y-4">
                      {conversationHistory.map((message, index) => (
                        <div key={index} className="flex items-start">
                          <div className={`${message.role === 'ai' ? 'bg-blue-900/30' : 'bg-gray-700/50'} p-2 rounded-full mr-2 flex-shrink-0`}>
                            {message.role === 'ai' ? (
                              <Waves className="h-4 w-4 text-blue-400" />
                            ) : (
                              <Mic className="h-4 w-4 text-gray-300" />
                            )}
                          </div>
                          <div className={`${message.role === 'ai' ? 'bg-blue-900/10 border-blue-900/30' : 'bg-gray-700/50'} rounded-lg p-3 text-gray-200 border border-gray-600 flex-1`}>
                            {message.text}
                          </div>
                        </div>
                      ))}
                      
                      {/* Current transcript (if active) */}
                      {status === 'active' && transcript && (
                        <div className="flex items-start">
                          <div className="bg-red-900/30 p-2 rounded-full mr-2 flex-shrink-0 animate-pulse">
                            <Mic className="h-4 w-4 text-red-400" />
                          </div>
                          <div className="bg-gray-700/50 rounded-lg p-3 text-gray-200 border border-gray-600 border-dashed flex-1">
                            {transcript}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      {connectionState === 'connected' ? 
                        'The interview will begin shortly...' : 
                        'Waiting for connection...'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Text Input (Optional) */}
            {showTextInput && (
              <Card className="border border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Send className="h-5 w-5 mr-2 text-blue-400" />
                      Text Input (Optional)
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTextInput(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <TextArea
                      name="textInput"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      label=""
                      placeholder="Type your response here if you prefer not to speak..."
                      rows={3}
                    />
                    <Button
                      variant="primary"
                      onClick={handleSendText}
                      disabled={!inputText.trim() || connectionState !== 'connected'}
                      className="self-end"
                    >
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Controls */}
            <div className="flex justify-between">
              {!showTextInput && (
                <Button
                  variant="outline"
                  leftIcon={Send}
                  onClick={toggleTextInput}
                >
                  Show Text Input
                </Button>
              )}
              
              <div className={showTextInput ? 'w-full flex justify-end' : ''}>
                <Button
                  variant="danger"
                  onClick={handleEndInterview}
                >
                  End Interview
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Hidden audio element for playback */}
        <audio ref={remoteAudioRef} autoPlay hidden />
      </div>
    </div>
  );
}