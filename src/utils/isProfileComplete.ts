import { UserProfile } from '../context/AuthContext';

/**
 * Checks if a given profile is considered complete
 * 
 * @param profile UserProfile object
 * @returns true if complete, false otherwise
 */
export function isProfileComplete(profile?: UserProfile | null): boolean {
  if (!profile) return false;

  // If profile_completed flag is explicitly set, use that
  if (profile.profileCompleted !== undefined) {
    return profile.profileCompleted;
  }

  // Otherwise, check if all required fields are filled
  return !!(
    profile.firstName?.trim() &&
    profile.lastName?.trim() &&
    profile.linkedinUrl?.trim() &&
    profile.resumeUrl?.trim()
  );
}