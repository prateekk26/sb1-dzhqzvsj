import { validateEmail, validateLinkedInUrl, validatePassword, validateDate } from '../validation';

describe('Validation Functions', () => {
  describe('validateEmail', () => {
    test('should return true for valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('name.surname@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    test('should return false for invalid emails', () => {
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user domain.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validateLinkedInUrl', () => {
    test('should return true for valid LinkedIn URLs', () => {
      expect(validateLinkedInUrl('https://www.linkedin.com/in/username')).toBe(true);
      expect(validateLinkedInUrl('http://linkedin.com/in/user-name')).toBe(true);
    });

    test('should return false for invalid LinkedIn URLs', () => {
      expect(validateLinkedInUrl('https://www.linkedin.com/company/name')).toBe(false);
      expect(validateLinkedInUrl('https://facebook.com')).toBe(false);
      expect(validateLinkedInUrl('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('should validate password criteria correctly', () => {
      // Valid password
      expect(validatePassword('Password123')).toEqual({ valid: true });
      
      // Too short
      expect(validatePassword('Pass1')).toEqual({
        valid: false,
        message: 'Password must be at least 8 characters'
      });
      
      // Missing uppercase
      expect(validatePassword('password123')).toEqual({
        valid: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      });
      
      // Missing lowercase
      expect(validatePassword('PASSWORD123')).toEqual({
        valid: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      });
      
      // Missing number
      expect(validatePassword('PasswordAbc')).toEqual({
        valid: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      });
    });
  });

  describe('validateDate', () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    test('should validate date format correctly', () => {
      expect(validateDate('2023-01-01')).toBe(true);
      expect(validateDate('01-01-2023')).toBe(false);
      expect(validateDate('2023/01/01')).toBe(false);
    });

    test('should validate dates in the past', () => {
      expect(validateDate(yesterdayStr)).toBe(true);
    });

    test('should validate today', () => {
      expect(validateDate(todayStr)).toBe(true);
    });

    test('should handle future dates based on allowFuture parameter', () => {
      expect(validateDate(tomorrowStr, false)).toBe(false);
      expect(validateDate(tomorrowStr, true)).toBe(true);
    });

    test('should handle invalid date inputs', () => {
      expect(validateDate('2023-13-01')).toBe(false); // Invalid month
      expect(validateDate('2023-01-32')).toBe(false); // Invalid day
      expect(validateDate('')).toBe(false); // Empty string
    });
  });
});