// Define common types used across the application

// Error types for better error handling
export type ErrorType = 
  | 'GENERIC' 
  | 'NETWORK' 
  | 'AUTH' 
  | 'PERMISSION' 
  | 'VALIDATION' 
  | 'NOT_FOUND'
  | 'TIMEOUT'
  | 'SERVER';

// Error response structure
export interface ErrorResponse {
  message: string;
  type: ErrorType;
  details?: string | null;
  timestamp?: string;
}

// User profile types
export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  linkedin_url: string | null;
  resume_url: string | null;
  created_at: string;
  updated_at: string;
  email: string | null;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string | ErrorResponse;
}

// Storage file types
export interface StorageFile {
  name: string;
  url: string;
  uploaded_at: string;
  fileType?: string;
}

// Status codes and messages
export const API_STATUS = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
};

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action. Please check your credentials.',
  NOT_FOUND: 'The requested resource was not found. Please check the URL and try again.',
  INVALID_INPUT: 'Invalid input provided. Please check your input and try again.',
  SERVER_ERROR: 'A server error occurred. Our team has been notified and is working on a fix.',
  EDGE_FUNCTION_ERROR: 'Failed to connect to the server function. Please try again later.',
  CONNECTION_ERROR: 'Connection error. Please check your internet connection and try again.',
  PERMISSION_DENIED: 'Permission denied. You do not have the necessary permissions for this action.',
  TIMEOUT_ERROR: 'The request timed out. Please try again later.',
  VALIDATION_ERROR: 'Validation error. Please check your input and try again.'
};

// OpenAI Realtime API interfaces
export interface EphemeralSessionResponse {
  client_secret: {
    value: string;
    expires_at: number;
  };
  server_secret?: {
    value: string;
    expires_at: number;
  };
  values?: Record<string, any>;
}

export interface InterviewFeedback {
  competency_analysis: {
    level: number;
    strengths: string[];
    gaps: string[];
  };
  feedback: string;
  follow_up_question?: string;
}

export interface RealtimeTranscriptionResponse {
  type: 'transcript' | 'final_transcript';
  text: string;
  start_time?: number;
  end_time?: number;
}

export interface RealtimeMessage {
  type: string;
  content?: string;
  message?: string;
  data?: any;
}

// WebRTC connection states
export type ConnectionStatus = 'idle' | 'connecting' | 'ready' | 'active' | 'thinking' | 'feedback' | 'error';

// OpenAI Realtime API interfaces
export interface EphemeralSessionResponse {
  client_secret: {
    value: string;
    expires_at: number;
  };
  server_secret?: {
    value: string;
    expires_at: number;
  };
  values?: Record<string, any>;
}

export interface InterviewFeedback {
  competency_analysis: {
    level: number;
    strengths: string[];
    gaps: string[];
  };
  feedback: string;
  follow_up_question?: string;
}

export interface RealtimeTranscriptionResponse {
  type: 'transcript' | 'final_transcript';
  text: string;
  start_time?: number;
  end_time?: number;
}

export interface RealtimeMessage {
  type: string;
  content?: string;
  message?: string;
  message?: string;
  data?: any;
}

// WebRTC connection states
export type ConnectionStatus = 'idle' | 'connecting' | 'ready' | 'active' | 'thinking' | 'feedback' | 'error';

// Interview types
export interface InterviewSession {
  sessionId: string;
  userId: string;
  questionId: string;
  competency: {
    code: string;
    name: string;
  };
  startTime: number;
}

// Interview grading types
export interface CompetencyGrade {
  code: string;
  name: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface InterviewGrade {
  overallScore: number;
  competencyScores: CompetencyGrade[];
  summary: string;
  strengths: string[];
  improvements: string[];
}

export interface JobMatchResult {
  matchScore: number;
  matchScoreRationale?: string;
  matchScoreRationale?: string;
  keywordMatches: {
    matched: string[];
    missing: string[];
  };
  skills: {
    matched: string[];
    missing: string[];
  };
  analysis: string;
  strengthsAnalysis?: string;
  gapsAnalysis?: string;
  strengthsAnalysis?: string;
  gapsAnalysis?: string;
  recommendations: string[];
  emailOutreach: string;
  linkedinOutreach: string;
  coverLetter: string;
  companyInfo?: string;
  companyRating?: number;
  salaryRange?: string;
  companyInfo?: string;
  companyRating?: number;
  salaryRange?: string;
}