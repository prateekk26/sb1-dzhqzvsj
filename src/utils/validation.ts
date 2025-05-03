// Validation utilities

import { ValidationFunction } from '../components/FormInput';

/**
 * Validate an email address format
 */
export function validateEmail(email: string): boolean {
  console.log(`Validating email: ${email}`);
  // More comprehensive email regex that handles most valid email formats
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const isValid = emailRegex.test(email);
  console.log(`Email validation result: ${isValid}`);
  return isValid;
}

/**
 * Email validation function for form inputs
 */
export const emailValidator: ValidationFunction = (email: string) => {
  if (!email.trim()) {
    return { valid: false, message: 'Email is required' };
  }
  
  if (!validateEmail(email)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }
  
  return { valid: true };
};

/**
 * Validate a LinkedIn URL format
 */
export function validateLinkedInUrl(url: string): boolean {
  console.log(`Validating LinkedIn URL: ${url}`);
  if (!url) return false;
  // Validate both personal and company LinkedIn URLs, or allow plain text for company names
  const isValid = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/[\w-]+\/?$/.test(url) || 
                  !url.includes('linkedin.com'); // Allow non-linkedin URLs as plain company names
  console.log(`LinkedIn URL validation result: ${isValid}`);
  return isValid;
}

/**
 * LinkedIn URL validation function for form inputs
 */
export const linkedInValidator: ValidationFunction = (url: string) => {
  if (!url.trim()) {
    return { valid: false, message: 'LinkedIn URL is required' };
  }
  
  if (!validateLinkedInUrl(url)) {
    return { valid: false, message: 'Please enter a valid LinkedIn URL or company name' };
  }
  
  return { valid: true };
};

/**
 * Validate a password meets requirements
 */
export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  console.log('Validating password');
  if (password.length < 8) {
    console.log('Password too short');
    return {
      valid: false,
      message: 'Password must be at least 8 characters',
    };
  }
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  if (!hasUppercase || !hasLowercase || !hasNumber) {
    console.log('Password missing required characters');
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    };
  }
  
  console.log('Password validation passed');
  return {
    valid: true,
  };
}

/**
 * Password validation function for form inputs
 */
export const passwordValidator: ValidationFunction = (password: string) => {
  const result = validatePassword(password);
  return { valid: result.valid, message: result.message };
};

/**
 * Name validation function for form inputs
 */
export const nameValidator: ValidationFunction = (name: string) => {
  if (!name.trim()) {
    return { valid: false, message: 'Name is required' };
  }
  
  if (name.trim().length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters' };
  }
  
  return { valid: true };
};

/**
 * Validate date is in proper format and not in the future
 */
export function validateDate(date: string, allowFuture: boolean = false): boolean {
  console.log(`Validating date: ${date}, allowFuture: ${allowFuture}`);
  if (!date) return false;
  
  // Check format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    console.log('Date format invalid');
    return false;
  }
  
  // Check if date is valid
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    console.log('Invalid date');
    return false;
  }
  
  // Check if date is not in future
  if (!allowFuture) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to beginning of day
    if (dateObj > today) {
      console.log('Date is in the future');
      return false;
    }
  }
  
  console.log('Date validation passed');
  return true;
}

/**
 * URL validation function
 */
export const urlValidator: ValidationFunction = (url: string) => {
  if (!url.trim()) {
    return { valid: false, message: 'URL is required' };
  }
  
  try {
    new URL(url);
    return { valid: true };
  } catch (e) {
    return { valid: false, message: 'Please enter a valid URL (e.g., https://example.com)' };
  }
};

/**
 * Phone number validation function
 */
export const phoneValidator: ValidationFunction = (phone: string) => {
  // Allow empty phone numbers (optional field)
  if (!phone.trim()) {
    return { valid: true };
  }
  
  // Basic phone validation - allows various formats
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  if (!phoneRegex.test(phone)) {
    return { valid: false, message: 'Please enter a valid phone number' };
  }
  
  return { valid: true };
};