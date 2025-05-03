import React, { useState, useEffect, useRef } from 'react';
import { Mic, StopCircle, MessageSquare, Sparkles, Volume2, RefreshCw, Star, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card'; 
import { Alert } from './Alert';
import { LoadingSpinner } from './LoadingState';
import { LandingSignupPrompt } from './LandingSignupPrompt';
import { InterviewQuestionCard } from './interview/InterviewQuestionCard';
import { UserResponseCard } from './interview/UserResponseCard';
import { FollowUpIndicator } from './interview/FollowUpIndicator';
import { Timer } from './interview/Timer';
import { v4 as uuidv4 } from 'uuid';

// Sample interview question
const SAMPLE_QUESTIONS = [
  {
    id: '1',
    question: 'Tell me about a time when you had to solve a complex problem under tight time constraints.',
    type: 'behavioral',
    competency: 'Problem Solving',
    primary_competency_code: 'CST'
  },
  {
    id: '2',
    question: 'Describe a situation where you had to work with a difficult team member. How did you handle it?',
    type: 'behavioral',
    competency: 'Teamwork',
    primary_competency_code: 'CI'
  },
  {
    id: '3',
    question: "Tell me about a project you're particularly proud of. What was your role and what made it successful?",
    type: 'behavioral',
    competency: 'Leadership',
    primary_competency_code: 'POI'
  }
];

// Sample follow-up questions
const SAMPLE_FOLLOWUPS = [
  'What specific actions did you take to address the situation?',
  'How did you measure the success of your solution?',
  'What would you do differently if you faced a similar situation again?',
  'Can you elaborate on the impact of your actions?',
  'How did this experience change your approach to similar problems?'
];

// Sample feedback templates
const FEEDBACK_TEMPLATES = [
  {
    positive: [
      'You provided a clear and structured response.',
      'Your example was relevant and demonstrated the competency well.',
      'You effectively highlighted your role in the situation.'
    ],
    improvement: [
      'Consider quantifying your results more specifically.',
      'Try to be more concise in your explanation of the context.',
      'Include more details about the specific actions you took.'
    ],
    summary: 'Overall, you demonstrated good communication skills and provided a relevant example. To improve, focus on quantifying your impact and being more specific about your actions.'
  },
  {
    positive: [
      'You articulated your thought process clearly.',
      'Your answer included a specific, relevant example.',
      'You demonstrated good problem-solving skills.'
    ],
    improvement: [
      'Consider structuring your response using the STAR method more explicitly.',
      'Include more details about the challenges you faced.',
      'Elaborate more on the lessons learned from this experience.'
    ],
    summary: 'Your response showed good critical thinking and communication skills. To enhance your answer, focus on a more structured approach and emphasize the results you achieved.'
  }
];

export function LandingMockInterview() {
  const [stage, setStage] = useState<'intro' | 'question' | 'recording' | 'processing' | 'feedback' | 'followup' | 'followup-recording' | 'followup-processing' | 'final-feedback' | 'rating' | 'signup'>('question');
  const [currentQuestion, setCurrentQuestion] = useState(SAMPLE_QUESTIONS[0]);
  const [followupQuestion, setFollowupQuestion] = useState('');
  const [initialResponse, setInitialResponse] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [feedback, setFeedback] = useState<any>(null);
  const [finalFeedback, setFinalFeedback] = useState<any>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Session state
  const [sessionId] = useState<string>(uuidv4());
  const [status, setStatus] = useState<'idle' | 'connecting' | 'ready' | 'active' | 'thinking' | 'feedback' | 'error'>('idle');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [questionTimerActive, setQuestionTimerActive] = useState(false);
  
  // Refs for recording
  const timerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Select a random question on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * SAMPLE_QUESTIONS.length);
    setCurrentQuestion(SAMPLE_QUESTIONS[randomIndex]);
  }, []);
  
  // Select a random follow-up question
  const selectRandomFollowup = () => {
    const randomIndex = Math.floor(Math.random() * SAMPLE_FOLLOWUPS.length);
    setFollowupQuestion(SAMPLE_FOLLOWUPS[randomIndex]);
  };
  
  // Generate feedback based on templates
  const generateFeedback = () => {
    const templateIndex = Math.floor(Math.random() * FEEDBACK_TEMPLATES.length);
    const template = FEEDBACK_TEMPLATES[templateIndex];
    
    // Select 2 random positive points and 2 random improvement points
    const positivePoints = [...template.positive].sort(() => 0.5 - Math.random()).slice(0, 2);
    const improvementPoints = [...template.improvement].sort(() => 0.5 - Math.random()).slice(0, 2);
    
    return {
      positivePoints,
      improvementPoints,
      summary: template.summary
    };
  };
  
  // Start recording
  const startRecording = async () => {
    try {
      setStatus('active');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Reset audio chunks
      audioChunksRef.current = [];
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // Simulate real-time transcription updates
          if (stage === 'recording' || stage === 'followup-recording') {
            simulateTranscriptionUpdates();
          }
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Process the recording
        if (stage === 'recording') {
          setStage('processing');
          simulateProcessing();
        } else if (stage === 'followup-recording') {
          setStage('followup-processing');
          simulateFinalProcessing();
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Could not access microphone. Please ensure you have granted permission.');
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setStatus('thinking');
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
  };
  
  // Simulate processing the recording
  const simulateProcessing = () => {
    setLoading(true);
    setStatus('thinking');
    // Save the initial response
    setInitialResponse(currentTranscript);
    
    // Simulate a delay for processing
    setTimeout(() => {
      setLoading(false);
      
      // Generate feedback
      const generatedFeedback = generateFeedback();
      setFeedback(generatedFeedback);
      
      // Select a follow-up question
      selectRandomFollowup();
      
      // Move directly to follow-up question stage without showing feedback
      setStage('followup');
      setStatus('ready');
    }, 2000);
  };
  
  // Simulate final processing
  const simulateFinalProcessing = () => {
    setLoading(true);
    setStatus('thinking');
    
    // Simulate a delay for processing
    setTimeout(() => {
      setLoading(false);
      
      // Generate final feedback
      // Combine both feedbacks for a more comprehensive final feedback
      const initialFeedback = feedback || generateFeedback();
      const followupFeedback = generateFeedback();
      
      const combinedFeedback = {
        positivePoints: [...initialFeedback.positivePoints, ...followupFeedback.positivePoints].slice(0, 3),
        improvementPoints: [...initialFeedback.improvementPoints, ...followupFeedback.improvementPoints].slice(0, 3),
        summary: "Overall, you demonstrated good communication skills and provided relevant examples in both your initial response and follow-up. Your answers showed thoughtful consideration of the questions. To improve further, focus on quantifying your impact and being more specific about your actions."
      };
      
      setStatus('feedback');
      setFinalFeedback(combinedFeedback);
      
      // Move to final feedback stage
      setStage('final-feedback');
    }, 2000);
  };
  
  // Simulate transcription updates
  const simulateTranscriptionUpdates = () => {
    // Sample transcription snippets to simulate real-time updates
    const transcriptionSnippets = [
      "So, there was a time when I had to solve a complex problem...",
      "So, there was a time when I had to solve a complex problem under tight deadlines. The situation was...",
      "So, there was a time when I had to solve a complex problem under tight deadlines. The situation was that our team was working on a critical project and we encountered an unexpected technical issue...",
      "So, there was a time when I had to solve a complex problem under tight deadlines. The situation was that our team was working on a critical project and we encountered an unexpected technical issue. My task was to identify the root cause and implement a solution quickly...",
      "So, there was a time when I had to solve a complex problem under tight deadlines. The situation was that our team was working on a critical project and we encountered an unexpected technical issue. My task was to identify the root cause and implement a solution quickly. I approached this by first analyzing the logs and then collaborating with the team to brainstorm potential solutions...",
      "So, there was a time when I had to solve a complex problem under tight deadlines. The situation was that our team was working on a critical project and we encountered an unexpected technical issue. My task was to identify the root cause and implement a solution quickly. I approached this by first analyzing the logs and then collaborating with the team to brainstorm potential solutions. As a result, we were able to resolve the issue ahead of schedule and the project was delivered successfully."
    ];
    
    // Simulate progressive transcription updates
    let snippetIndex = 0;
    const transcriptionInterval = setInterval(() => {
      if (snippetIndex < transcriptionSnippets.length) {
        setCurrentTranscript(transcriptionSnippets[snippetIndex]);
        snippetIndex++;
      } else {
        clearInterval(transcriptionInterval);
      }
    }, 1000);
  };
  
  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle rating selection
  const handleRating = (value: number) => {
    setRating(value);
  };
  
  // Handle submitting the rating
  const handleSubmitRating = () => {
    setStage('signup');
  };
  
  // Render the intro stage
  const renderIntro = () => (
    <div className="max-w-3xl mx-auto transition-all duration-300">
    <Card className="border border-gray-700 max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-[#FF8A00]" />
          Try Our AI Mock Interview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert
          variant="info"
          message="Experience a free sample of our AI-powered mock interview. Answer one question, get instant feedback, and see how our platform can help you ace your next interview."
          className="mb-4"
        />
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-white font-medium mb-2">How it works:</h3>
          <ol className="space-y-2 text-gray-300">
            <li className="flex items-start">
              <span className="bg-[#FF8A00]/20 text-[#FF8A00] w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0">1</span>
              <span>You'll be asked one interview question</span>
            </li>
            <li className="flex items-start">
              <span className="bg-[#FF8A00]/20 text-[#FF8A00] w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0">2</span>
              <span>Record your answer using your microphone</span>
            </li>
            <li className="flex items-start">
              <span className="bg-[#FF8A00]/20 text-[#FF8A00] w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0">3</span>
              <span>Get instant AI feedback on your response</span>
            </li>
            <li className="flex items-start">
              <span className="bg-[#FF8A00]/20 text-[#FF8A00] w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0">4</span>
              <span>Answer a follow-up question for a complete experience</span>
            </li>
          </ol>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-gray-700 pt-4">
        <Button
          variant="primary"
          size="lg"
          leftIcon={MessageSquare}
          onClick={() => setStage('question')}
          className="px-6"
        >
          Start Sample Interview
        </Button>
      </CardFooter>
    </Card>
    </div>
  );
  
  // Render the question stage
  const renderQuestion = () => (
    <div className="max-w-3xl mx-auto">
      <Card className="border border-gray-700 max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-[#FF8A00]" />
          Interview Question
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <p className="text-white text-lg">{currentQuestion.question}</p>
          <div className="flex mt-4 text-sm text-gray-400">
            <span className="bg-[#FF8A00]/20 text-[#FF8A00] px-2 py-1 rounded text-xs mr-2">
              {currentQuestion.type}
            </span>
            <span className="bg-gray-700 px-2 py-1 rounded text-xs">
              {currentQuestion.competency}
            </span>
          </div>
        </div>
        
        <Alert
          variant="info"
          message="When you're ready, click the button below to start recording your answer. Try to structure your response using the STAR method (Situation, Task, Action, Result)."
          className="mb-4"
        />
      </CardContent>
      <CardFooter className="flex justify-center border-t border-gray-700 pt-4">
        <Button
          variant="primary"
          leftIcon={Mic}
          onClick={() => {
            setStage('recording');
            startRecording();
          }}
        >
          Start Recording Your Answer
        </Button>
      </CardFooter>
    </Card>
    </div>
  );
  
  // Render the recording stage
  const renderRecording = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="border border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Mic className="h-5 w-5 mr-2 text-[#FF8A00]" />
            Recording Your Answer
          </span>
          <span className="text-red-400 font-mono">{formatTime(recordingTime)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <div className="py-4">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-900/30 animate-pulse mb-4">
            <div className="w-6 h-6 bg-red-500 rounded-full"></div>
          </div>
          
          <p className="text-gray-300 mb-6">
            Speak clearly into your microphone. Try to keep your answer under 2 minutes.
          </p>
          
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
      </CardContent>
    </Card>
    
      {/* Question display using the actual component */}
      <InterviewQuestionCard
        currentQuestion={currentQuestion}
        followUpQuestion={null}
        currentTranscript=""
        status={status}
        connected={true}
        connecting={false}
        isGeneratingResponse={false}
        onRefresh={() => {}}
        onConnect={() => {}}
      />
      
      {/* Response display using the actual component */}
      <UserResponseCard
        status={status}
        currentTranscript={currentTranscript}
        feedback={null}
        connected={true}
        connecting={false}
        isInterviewActive={true}
        sessionId={sessionId}
        onEndInterview={stopRecording}
      />
    </div>
  );
  
  // Render the processing stage
  const renderProcessing = () => (
    <Card className="border border-gray-700 max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-[#FF8A00]" />
          Analyzing Your Response
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center py-8">
        <LoadingSpinner size="large" />
        <p className="text-gray-300 mt-4">
          Our AI is analyzing your response and preparing feedback...
        </p>
      </CardContent>
    </Card>
  );
  
  // Render the feedback stage
  const renderFeedback = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Follow-up indicator using the actual component */}
      <FollowUpIndicator
        type="deeper_dive"
        currentCount={1}
        maxCount={1}
      />
      
      {/* Question display using the actual component */}
      <InterviewQuestionCard
        currentQuestion={null}
        followUpQuestion={followupQuestion}
        currentTranscript={initialResponse}
        status={status}
        connected={true}
        connecting={false}
        isGeneratingResponse={false}
        onRefresh={() => {}}
        onConnect={() => {}}
      />
      
      {/* Response card with button to start recording follow-up */}
      <Card className="border border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mic className="h-5 w-5 mr-2 text-[#FF8A00]" />
            Your Response
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert
            variant="info"
            message="Now it's time to answer the follow-up question. This helps the interviewer get a more complete picture of your experience and skills."
            className="mb-4"
          />
        </CardContent>
        <CardFooter className="flex justify-center border-t border-gray-700 pt-4">
          <Button
            variant="primary"
            leftIcon={Mic}
            onClick={() => {
              setStage('followup-recording');
              startRecording();
            }}
          >
            Record Follow-up Answer
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
  
  // Render the followup recording stage
  const renderFollowupRecording = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="border border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Mic className="h-5 w-5 mr-2 text-[#FF8A00]" />
            Recording Follow-up Answer
          </span>
          <span className="text-red-400 font-mono">{formatTime(recordingTime)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-900/20 border border-blue-700/30 p-3 rounded-lg mb-4">
          <p className="text-white">{followupQuestion}</p>
        </div>
        
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-900/30 animate-pulse mb-4">
            <div className="w-5 h-5 bg-red-500 rounded-full"></div>
          </div>
          
          <p className="text-gray-300 mb-6">
            Recording your follow-up answer...
          </p>
          
          <Button 
            variant="outline" 
            leftIcon={StopCircle} 
            onClick={stopRecording} 
            className="text-red-400 border-red-500/30 hover:bg-red-900/20"
          >
            Stop Recording
          </Button>
        </div>
      </CardContent>
      </Card>
      
      {/* Follow-up indicator using the actual component */}
      <FollowUpIndicator
        type="deeper_dive"
        currentCount={1}
        maxCount={1}
      />
      
      {/* Question display using the actual component */}
      <InterviewQuestionCard
        currentQuestion={null}
        followUpQuestion={followupQuestion}
        currentTranscript={currentTranscript}
        status={status}
        connected={true}
        connecting={false}
        isGeneratingResponse={false}
        onRefresh={() => {}}
        onConnect={() => {}}
      />
    </div>
  );
  
  // Render the final feedback stage
  const renderFinalFeedback = () => (
    <Card className="border border-gray-700 max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <Sparkles className="h-5 w-5 mr-2 text-[#FF8A00]" />
          <span>Comprehensive Feedback</span>
          <span className="text-green-400 text-sm flex items-center">
            <CheckCircle className="h-4 w-4 mr-1" />
            Interview Complete
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert
          variant="success"
          message="Great job completing the mock interview! Here's your comprehensive feedback based on both your initial response and follow-up answer."
          className="mb-4"
        />
        
        <div className="bg-gray-800 p-6 rounded-lg border border-[#FF8A00]/20">
          <h3 className="text-white font-medium mb-4">What you did well:</h3>
          <ul className="space-y-2 mb-6">
            {finalFeedback.positivePoints.map((point: string, index: number) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">{point}</span>
              </li>
            ))}
          </ul>
          
          <h3 className="text-white font-medium mb-4">Areas for improvement:</h3>
          <ul className="space-y-2 mb-6">
            {finalFeedback.improvementPoints.map((point: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span className="text-gray-300">{point}</span>
              </li>
            ))}
          </ul>
          
          <h3 className="text-white font-medium mb-2">Summary:</h3>
          <p className="text-gray-300">{finalFeedback.summary}</p>
        </div>
        
        <div className="bg-blue-900/20 border border-blue-700/30 p-4 rounded-lg">
          <h3 className="text-blue-400 font-medium mb-2 flex items-center">
            <Sparkles className="h-4 w-4 mr-2" />
            What's Next?
          </h3>
          <p className="text-gray-300 text-sm">
            This is just a taste of what our platform offers. The full version provides:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>Comprehensive interviews with multiple questions</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>Detailed competency-based scoring and analysis</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>Progress tracking and improvement suggestions over time</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>Industry-specific question banks tailored to your target roles</span>
            </li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-gray-700 pt-4">
        <Button
          variant="primary"
          leftIcon={Star}
          onClick={() => setStage('rating')}
        >
          Rate Your Experience
        </Button>
      </CardFooter>
    </Card>
  );
  
  // Render the rating stage
  const renderRating = () => (
    <Card className="border border-gray-700 max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Star className="h-5 w-5 mr-2 text-[#FF8A00]" />
          Rate Your Experience
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center py-6">
        <h3 className="text-white text-lg font-medium mb-6">How would you rate this mock interview experience?</h3>
        
        <div className="flex justify-center space-x-2 mb-8">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                rating === value 
                  ? 'bg-[#FF8A00] text-white' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
              onClick={() => handleRating(value)}
            >
              <Star className={`h-6 w-6 ${rating === value ? 'fill-current' : ''}`} />
            </button>
          ))}
        </div>
        
        <p className="text-gray-300 mb-6">
          This is just a small sample of what HireIQ offers. Sign up to access our full suite of interview preparation tools.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-gray-700 pt-4">
        <Button
          variant="primary"
          onClick={handleSubmitRating}
          disabled={!rating}
        >
          Submit & Continue
        </Button>
      </CardFooter>
    </Card>
  );
  
  // Render the signup stage
  const renderSignup = () => (
    <div className="max-w-4xl mx-auto">
      <LandingSignupPrompt />
    </div>
  );
  
  // Render the appropriate stage
  const renderStage = () => {
    switch (stage) {
      case 'intro':
        return renderIntro();
      case 'question':
        return renderQuestion();
      case 'recording':
        return renderRecording();
      case 'processing':
        return renderProcessing();
      case 'feedback':
        return renderFeedback();
      case 'followup-recording':
        return renderFollowupRecording();
      case 'followup-processing':
        return renderProcessing();
      case 'final-feedback':
        return renderFinalFeedback();
      case 'rating':
        return renderRating();
      case 'signup':
        return renderSignup();
      default:
        return renderIntro();
    }
  };
  
  return (
    <div className="py-8 px-4">
      <div className="max-w-5xl mx-auto mb-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Experience Our AI Mock Interview
          </h2>
          <p className="text-gray-400 text-lg">
            Practice with our AI interviewer and get instant feedback on your responses
          </p>
        </div>
        {renderStage()}
      </div>
    </div>
  );
}