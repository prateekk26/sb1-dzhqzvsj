import { useReducer, Dispatch } from 'react';
import { InterviewQuestion } from './useInterviewQuestions';

// Connection status types
export type ConnectionStatus = 'idle' | 'connecting' | 'ready' | 'active' | 'thinking' | 'feedback' | 'error';

// Define action types for our reducer
export type InterviewAction = 
  | { type: 'SET_CONNECTING', payload: boolean }
  | { type: 'SET_CONNECTED', payload: boolean }
  | { type: 'SET_ERROR', payload: string | null }
  | { type: 'SET_DETAILED_ERROR', payload: string | null }
  | { type: 'SET_INTERVIEW_ACTIVE', payload: boolean }
  | { type: 'SET_CURRENT_QUESTION', payload: InterviewQuestion | null }
  | { type: 'SET_TRANSCRIPT', payload: string }
  | { type: 'SET_GENERATING_RESPONSE', payload: boolean }
  | { type: 'SET_FEEDBACK', payload: string | null }
  | { type: 'SET_FOLLOW_UP_QUESTION', payload: string | null }
  | { type: 'SET_AUDIO_PERMISSION', payload: boolean }
  | { type: 'SET_MICROPHONE_ACTIVE', payload: boolean }
  | { type: 'SET_SPEAKER_ACTIVE', payload: boolean }
  | { type: 'SET_STATUS', payload: ConnectionStatus }
  | { type: 'RESET_SESSION' };

// Define our state interface
export interface InterviewState {
  connecting: boolean;
  connected: boolean;
  connectionError: string | null;
  lastErrorDetails: string | null;
  isInterviewActive: boolean;
  currentQuestion: InterviewQuestion | null;
  currentTranscript: string;
  isGeneratingResponse: boolean;
  feedback: string | null;
  followUpQuestion: string | null;
  audioPermissionGranted: boolean;
  microphoneActive: boolean;
  speakerActive: boolean;
  status: ConnectionStatus;
}

// Initial state
export const initialInterviewState: InterviewState = {
  connecting: false,
  connected: false,
  connectionError: null,
  lastErrorDetails: null,
  isInterviewActive: false,
  currentQuestion: null,
  currentTranscript: '',
  isGeneratingResponse: false,
  feedback: null,
  followUpQuestion: null,
  audioPermissionGranted: false,
  microphoneActive: false,
  speakerActive: false,
  status: 'idle',
};

// Reducer function to handle all state transitions
export function interviewReducer(state: InterviewState, action: InterviewAction): InterviewState {
  switch (action.type) {
    case 'SET_CONNECTING':
      return { ...state, connecting: action.payload };
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload };
    case 'SET_ERROR':
      return { ...state, connectionError: action.payload };
    case 'SET_DETAILED_ERROR':
      return { ...state, lastErrorDetails: action.payload };
    case 'SET_INTERVIEW_ACTIVE':
      return { ...state, isInterviewActive: action.payload };
    case 'SET_CURRENT_QUESTION':
      return { ...state, currentQuestion: action.payload };
    case 'SET_TRANSCRIPT':
      return { ...state, currentTranscript: action.payload };
    case 'SET_GENERATING_RESPONSE':
      return { ...state, isGeneratingResponse: action.payload };
    case 'SET_FEEDBACK':
      return { ...state, feedback: action.payload };
    case 'SET_FOLLOW_UP_QUESTION':
      return { ...state, followUpQuestion: action.payload };
    case 'SET_AUDIO_PERMISSION':
      return { ...state, audioPermissionGranted: action.payload };
    case 'SET_MICROPHONE_ACTIVE':
      return { ...state, microphoneActive: action.payload };
    case 'SET_SPEAKER_ACTIVE':
      return { ...state, speakerActive: action.payload };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'RESET_SESSION':
      return {
        ...state,
        isInterviewActive: false,
        currentTranscript: '',
        feedback: null,
        followUpQuestion: null,
        status: 'idle',
        isGeneratingResponse: false
      };
    default:
      return state;
  }
}

export function useInterviewReducer() {
  return useReducer(interviewReducer, initialInterviewState);
}

// Fallback question for when no questions are available
export const FALLBACK_QUESTION = {
  id: "fallback-question-id",
  question: "Tell me about a time when you had to solve a complex problem under tight time constraints.",
  primary_competency_code: "CST",
  secondary_competency_code: null,
  type: "behavioral",
  difficulty: "medium",
  question_id: "CST-1"
};