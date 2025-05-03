// src/types/UserProfile.ts

export interface UserProfile {
  firstName: string | null;
  lastName: string | null;
  linkedinUrl: string | null;
  resumeUrl: string | null;
  email: string | null;
  role?: 'user' | 'recruiter' | 'admin';
  suspended?: boolean;
}