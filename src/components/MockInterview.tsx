import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mic, 
  StopCircle, 
  RefreshCw, 
  AlertCircle, 
  MessageSquare,
  Clock,
  CheckCircle,
  Sparkles,
  Award
} from 'lucide-react';
import { Button } from './Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import { Alert } from './Alert';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './LoadingState';
import { supabase } from '../lib/supabase';
import RecordRTC from 'recordrtc';
import { useInterviewQuestions, InterviewQuestion } from '../hooks/useInterviewQuestions';
import { useInterviewGrading, TranscriptData } from '../hooks/useInterviewGrading';
import { Timer } from './interview/Timer';
import { GradingResults } from './interview/GradingResults';
import { ConversationHistory } from './interview/ConversationHistory';
import { v4 as uuidv4 } from 'uuid';

// Define types for QA pairs
interface QAPair {
  id: string;
  questionType: 'main' | 'follow-up';
  questionText: string;
  responseText: string;
  feedbackText?: string;
  timestamp: Date;
  questionId?: string;
}

export default function MockInterview() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { questions, loading: questionsLoading } = useInterviewQuestions();
  const { gradeInterview, loading: gradingLoading, result: gradingResult } = useInterviewGrading();

  // State for interview flow
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [processing, setProcessing] = useState(false);
  
  // Current question state
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [currentFeedback, setCurrentFeedback] = useState<any | null>(null);
  
  // Session management
  const [sessionId] = useState<string>(uuidv4());
  const [sessionStatus, setSessionStatus] = useState<'initial' | 'in_progress' | 'complete' | 'grading' | 'graded'>('initial');
  const [qaPairs, setQaPairs] = useState<QAPair[]>([]);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [followUpMode, setFollowUpMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Maximum follow-ups per question
  const MAX_FOLLOWUPS = 2;
  
  // Recording refs
  const recorderRef = useRef<RecordRTC | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Session management - initialize when component loads
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
      return;
    }
    
    // Initialize audio element for playback
    audioRef.current = new Audio();
    
    // Clean up on unmount
    return () => {
      if (recorderRef.current) {
        recorderRef.current.stopRecording();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [authLoading, user, navigate]);

  // Select a random question when component mounts
  useEffect(() => {
    if (!questionsLoading && questions.length > 0 && !currentQuestion) {
      getRandomQuestion();
    }
  }, [questionsLoading, questions]);

  // Get a random question
  const getRandomQuestion = useCallback(() => {
    if (questions.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * questions.length);
    const selectedQuestion = questions[randomIndex];
    
    // Reset the interview state
    setCurrentQuestion(selectedQuestion);
    setCurrentTranscript('');
    setCurrentFeedback(null);
    setFollowUpCount(0);
    setFollowUpMode(false);
    setSessionStatus('in_progress');
    setQaPairs([]);
    
    console.log('Selected new interview question:', selectedQuestion?.question);
  }, [questions]);

  // Generate speech for the question
  const generateSpeech = useCallback(async (questionId: string, questionText: string) => {
    try {
      console.log('Generating speech for question:', questionText);
      
      const { data, error } = await supabase.functions.invoke('interview-websocket', {
        body: { 
          questionId,
          generateSpeech: true,
          useCustomIntro: true,
          customIntroText: "Hello, I'm your interviewer today. I'd like to ask you the following question: {question}"
        }
      });
      
      if (error) {
        console.error('Speech generation error:', error);
        return;
      }
      
      if (!data?.speech) {
        console.error('No speech data returned');
        return;
      }
      
      // Convert base64 to audio blob
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.speech), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Set up and play audio
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };
        await audioRef.current.play();
      }
    } catch (err) {
      console.error('Error generating or playing speech:', err);
    }
  }, []);

  // Play the current question audio
  const playQuestionAudio = useCallback(() => {
    if (!currentQuestion) return;
    
    const textToSpeak = followUpMode && qaPairs.length > 0 
      ? qaPairs[qaPairs.length - 1].feedbackText
      : currentQuestion.question;
    
    generateSpeech(currentQuestion.id, textToSpeak || currentQuestion.question);
  }, [currentQuestion, followUpMode, qaPairs, generateSpeech]);

  // Start recording the user's answer
  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      recorderRef.current = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/webm',
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000,
      });
      
      recorderRef.current.startRecording();
      setIsRecording(true);
      
      // Start recording timer
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please ensure you have granted permission.');
    }
  };

  // Stop recording and process the audio
  const stopRecording = () => {
    if (!recorderRef.current) return;
    
    recorderRef.current.stopRecording(async () => {
      const blob = recorderRef.current?.getBlob();
      if (!blob) return;
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      setIsRecording(false);
      await processRecording(blob);
    });
  };

  // Convert blob to base64
  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const result = reader.result?.toString().split(',')[1];
        if (result) resolve(result);
        else reject(new Error('Failed to convert audio to base64'));
      };
      reader.onerror = reject;
    });
  };

  // Process the recording and get feedback
  const processRecording = async (blob: Blob) => {
    if (!user?.id || !currentQuestion) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      const base64Audio = await convertBlobToBase64(blob);
      
      // Determine if this is a follow-up question response
      const followUpContext = followUpMode && qaPairs.length > 0
        ? {
            originalResponse: qaPairs[qaPairs.length - 2]?.responseText || '',
            followUpQuestion: qaPairs[qaPairs.length - 1]?.questionText || ''
          }
        : null;
      
      // Get the current question text
      const questionText = followUpMode && qaPairs.length > 0
        ? qaPairs[qaPairs.length - 1].questionText
        : currentQuestion.question;
      
      console.log('Processing response for question:', questionText);
      console.log('Follow-up context:', followUpContext);
      
      const { data, error } = await supabase.functions.invoke('interview-websocket', {
        body: { 
          audioChunk: base64Audio,
          questionId: currentQuestion.id,
          userId: user.id,
          followUpContext
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Set the current transcript and feedback
      setCurrentTranscript(data.transcription);
      setCurrentFeedback(data.analysis);
      
      // Save this Q&A pair
      const newPair: QAPair = {
        id: uuidv4(),
        questionType: followUpMode ? 'follow-up' : 'main',
        questionText: questionText,
        responseText: data.transcription,
        feedbackText: data.analysis.feedback,
        timestamp: new Date(),
        questionId: currentQuestion.id // Store the question ID for grading
      };
      
      // Add to QA pairs history
      setQaPairs(prev => [...prev, newPair]);
      
      // Check if we need to show a follow-up question
      if (data.analysis.follow_up_question && followUpCount < MAX_FOLLOWUPS) {
        // Prepare for follow-up
        setFollowUpCount(prev => prev + 1);
        setFollowUpMode(true);
        
        // Add the follow-up question to QA pairs
        const followUpPair: QAPair = {
          id: uuidv4(),
          questionType: 'follow-up',
          questionText: data.analysis.follow_up_question,
          responseText: '', // Will be filled in after user responds
          timestamp: new Date(),
          questionId: currentQuestion.id // Store the question ID for the follow-up as well
        };
        
        setQaPairs(prev => [...prev, followUpPair]);
      } else {
        // No more follow-ups, move to completion
        setSessionStatus('complete');
        setFollowUpMode(false);
        
        // Save the complete interview
        await saveInterviewSession(qaPairs.concat(newPair), data.analysis);
        
        // Grade the interview now that it's complete
        await gradeInterviewSession(qaPairs.concat(newPair));
      }
    } catch (err) {
      console.error('Error processing recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to process recording');
    } finally {
      setProcessing(false);
      setCurrentTranscript('');
    }
  };

  // Grade the interview after completion
  const gradeInterviewSession = async (completedQaPairs: QAPair[]) => {
    if (!user?.id || completedQaPairs.length === 0) return;
    
    try {
      console.log('Starting interview grading process...');
      setSessionStatus('grading');
      
      // Format transcript data for grading
      const transcripts: TranscriptData[] = completedQaPairs
        .filter(pair => pair.responseText) // Only include answered questions
        .map(pair => ({
          questionId: pair.questionId || '', // Using the stored question ID
          transcript: pair.responseText,
          feedback: pair.feedbackText
        }));
      
      // Call the grade interview function
      const result = await gradeInterview({
        transcripts,
        userId: user.id,
        sessionId: sessionId
      });
      
      if (result) {
        console.log('Interview grading complete:', result);
        setSessionStatus('graded');
      } else {
        console.error('Interview grading failed');
        setSessionStatus('complete'); // Fall back to just "complete" if grading fails
      }
    } catch (err) {
      console.error('Error grading interview session:', err);
      setSessionStatus('complete'); // Fall back to just "complete" if grading fails
    }
  };

  // Save the completed interview to the database
  const saveInterviewSession = async (completedQaPairs: QAPair[], finalFeedback: any) => {
    if (!user?.id) return;
    
    try {
      console.log('Saving interview session with', completedQaPairs.length, 'QA pairs');
      
      // Prepare transcript combining all Q&A pairs
      const fullTranscript = completedQaPairs
        .map(pair => `Q: ${pair.questionText}\nA: ${pair.responseText}`)
        .join('\n\n');
      
      // Save to database
      const { error: dbError } = await supabase
        .from('mock_interviews')
        .insert({
          user_id: user.id,
          transcript: fullTranscript,
          competency_scores: finalFeedback,
          feedback: finalFeedback.feedback,
          status: 'completed'
        });
        
      if (dbError) {
        console.error('Error saving interview:', dbError);
      }
    } catch (err) {
      console.error('Error saving interview session:', err);
    }
  };

  // Format recording time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset the entire interview
  const resetInterview = () => {
    // Clear all state
    setCurrentTranscript('');
    setCurrentFeedback(null);
    setFollowUpCount(0);
    setFollowUpMode(false);
    setQaPairs([]);
    setSessionStatus('initial');
    
    // Get a new question
    getRandomQuestion();
  };

  // Handle scenario where no questions are available
  if (authLoading || questionsLoading) {
    return <LoadingSpinner />;
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0F121A] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border border-gray-700">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Questions Available</h2>
            <p className="text-gray-400 mb-4">
              Please add some interview questions to your question bank before starting a mock interview.
            </p>
            <Button onClick={() => navigate('/interview-questions')}>
              Add Questions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show grading results screen if we have completed grading
  if (sessionStatus === 'graded' && gradingResult) {
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
            results={gradingResult} 
            onStartNew={resetInterview} 
          />
        </div>
      </div>
    );
  }

  // Show loading state while grading is in progress
  if (sessionStatus === 'grading') {
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
          
          <Card className="border border-gray-700 text-center p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-6">
                <div className="w-16 h-16 border-4 border-gray-700 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-[#FF8A00] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Award className="h-8 w-8 text-[#FF8A00]" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Analyzing Your Performance</h2>
              <p className="text-gray-400 max-w-md mx-auto mb-6">
                We're evaluating your interview responses across multiple competencies to provide you with a comprehensive assessment.
              </p>
              <div className="flex items-center text-[#FF8A00]">
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Please wait while we grade your interview...
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
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
            <h1 className="text-3xl font-bold text-white mb-2">Mock Interview Practice</h1>
            <p className="text-gray-400 text-sm">
              Practice your interview responses and get AI feedback on your answers.
            </p>
          </div>
          
          <Button
            variant="outline"
            leftIcon={RefreshCw}
            onClick={resetInterview}
            disabled={isRecording || processing}
          >
            New Question
          </Button>
        </div>
        
        <div className="space-y-6">
          {/* Interview Question Card - Always shows the main question */}
          <Card className="border border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  Interview Question
                  {followUpMode && (
                    <span className="bg-blue-900/30 text-blue-300 text-xs px-2 py-0.5 rounded-full">
                      Follow-up {followUpCount}/{MAX_FOLLOWUPS}
                    </span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={playQuestionAudio}
                  className="text-gray-400"
                >
                  Play Audio
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Always display the main question */}
              <div className={`${followUpMode ? 'opacity-60' : 'opacity-100'} transition-opacity`}>
                <p className="text-gray-300 font-medium">
                  {currentQuestion?.question}
                </p>
              </div>
              
              {/* Show the follow-up question if in follow-up mode */}
              {followUpMode && qaPairs.length > 0 && (
                <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-blue-600/30 animate-fadeIn">
                  <div className="flex items-center text-blue-400 mb-2">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span className="font-medium">Follow-up Question:</span>
                  </div>
                  <p className="text-white">
                    {qaPairs[qaPairs.length - 1].questionText}
                  </p>
                  
                  {/* Show context from previous response */}
                  {qaPairs.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-400 mb-1">Based on your previous response:</p>
                      <p className="text-sm text-gray-300 italic">
                        "{qaPairs[qaPairs.length - 2].responseText}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Recording Card */}
          <Card className="border border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mic className="h-5 w-5 mr-2 text-[#FF8A00]" />
                <span>Record Your Answer</span>
                
                {isRecording && (
                  <div className="ml-auto">
                    <Timer active={true} duration={180} className="text-red-400" />
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="error" message={error} className="mb-4" onClose={() => setError(null)} />
              )}
              
              <div className="flex flex-col items-center justify-center py-8">
                {isRecording ? (
                  <div className="space-y-4 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/30 animate-pulse">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    </div>
                    <div className="text-xl font-mono text-red-400">{formatTime(recordingTime)}</div>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      leftIcon={StopCircle} 
                      onClick={stopRecording} 
                      className="text-red-400 border-red-500/30 hover:bg-red-900/20"
                    >
                      Stop Recording
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 text-center">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      leftIcon={Mic} 
                      onClick={startRecording} 
                      disabled={processing || sessionStatus === 'complete'} 
                      className="text-[#FF8A00] border-[#FF8A00]/30 hover:bg-[#FF8A00]/10"
                    >
                      {sessionStatus === 'complete' 
                        ? 'Interview Complete' 
                        : followUpMode 
                          ? 'Record Follow-up Response' 
                          : 'Start Recording'}
                    </Button>
                    {processing && (
                      <div className="flex items-center justify-center text-gray-400">
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing your response...
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {currentFeedback && !followUpMode && (
                <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-[#FF8A00]/30 animate-fadeIn">
                  <div className="flex items-center text-[#FF8A00] mb-3">
                    <Sparkles className="h-4 w-4 mr-2" />
                    <span className="font-medium">AI Feedback:</span>
                  </div>
                  <p className="text-gray-300 whitespace-pre-line">{currentFeedback.feedback}</p>
                  
                  {/* Show the follow-up prompt if available */}
                  {currentFeedback.follow_up_question && qaPairs.length > 0 && followUpMode && (
                    <div className="mt-4 pt-3 border-t border-gray-600">
                      <p className="text-blue-300">
                        <span className="font-medium">Follow-up question:</span> {currentFeedback.follow_up_question}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Conversation History */}
          {qaPairs.length > 0 && (
            <ConversationHistory
              qaPairs={qaPairs}
              sessionComplete={sessionStatus === 'complete' || sessionStatus === 'grading' || sessionStatus === 'graded'}
            />
          )}
        </div>
      </div>
    </div>
  );
}