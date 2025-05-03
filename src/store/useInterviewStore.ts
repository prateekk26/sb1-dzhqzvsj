import { create } from 'zustand';
import { InterviewQuestion } from '../hooks/useInterviewQuestions';

export type ConnectionStatus = 'idle' | 'connecting' | 'ready' | 'active' | 'thinking' | 'feedback' | 'error';

interface InterviewState {
  // Connection state
  connecting: boolean;
  connected: boolean;
  connectionError: string | null;
  lastErrorDetails: string | null;
  
  // Interview state
  isInterviewActive: boolean;
  currentQuestion: InterviewQuestion | null;
  currentTranscript: string;
  isGeneratingResponse: boolean;
  feedback: string | null;
  followUpQuestion: string | null;
  
  // Audio state
  audioPermissionGranted: boolean;
  microphoneActive: boolean;
  speakerActive: boolean;
  
  // Status
  status: ConnectionStatus;
  
  // Session
  sessionId: string | null;
}

interface InterviewActions {
  setConnecting: (connecting: boolean) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  setDetailedError: (error: string | null) => void;
  setInterviewActive: (active: boolean) => void;
  setCurrentQuestion: (question: InterviewQuestion | null) => void;
  setTranscript: (transcript: string) => void;
  setGeneratingResponse: (generating: boolean) => void;
  setFeedback: (feedback: string | null) => void;
  setFollowUpQuestion: (question: string | null) => void;
  setAudioPermission: (granted: boolean) => void;
  setMicrophoneActive: (active: boolean) => void;
  setSpeakerActive: (active: boolean) => void;
  setStatus: (status: ConnectionStatus) => void;
  setSessionId: (id: string | null) => void;
  resetSession: () => void;
}

export const useInterviewStore = create<InterviewState & InterviewActions>((set) => ({
  // Initial state
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
  sessionId: null,
  
  // Actions
  setConnecting: (connecting) => set({ connecting }),
  setConnected: (connected) => set({ connected }),
  setError: (error) => set({ connectionError: error }),
  setDetailedError: (error) => set({ lastErrorDetails: error }),
  setInterviewActive: (active) => set({ isInterviewActive: active }),
  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  setTranscript: (transcript) => set({ currentTranscript: transcript }),
  setGeneratingResponse: (generating) => set({ isGeneratingResponse: generating }),
  setFeedback: (feedback) => set({ feedback }),
  setFollowUpQuestion: (question) => set({ followUpQuestion: question }),
  setAudioPermission: (granted) => set({ audioPermissionGranted: granted }),
  setMicrophoneActive: (active) => set({ microphoneActive: active }),
  setSpeakerActive: (active) => set({ speakerActive: active }),
  setStatus: (status) => set({ status }),
  setSessionId: (id) => set({ sessionId: id }),
  resetSession: () => set({
    isInterviewActive: false,
    currentTranscript: '',
    feedback: null,
    followUpQuestion: null,
    status: 'idle',
    isGeneratingResponse: false
  })
}));