// Define common types used across the application

// Session configuration types
export interface SessionConfig {
  numQuestions: number;
  selectedCompetencies: string[];
  sessionDuration: number; // in seconds
  questionDuration: number; // in seconds
}