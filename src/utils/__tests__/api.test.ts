import { createApiResponse, handleApiError } from '../api';
import { API_STATUS, ERROR_MESSAGES } from '../types';
import { vi } from 'vitest';

// Mock the supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({}),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null })
    }
  }
}));

describe('API Utilities', () => {
  describe('createApiResponse', () => {
    test('creates a successful response with data', () => {
      const data = { id: 1, name: 'Test' };
      const response = createApiResponse(data);
      
      expect(response.status).toBe(API_STATUS.SUCCESS);
      
      // Parse the response body
      return response.json().then(body => {
        expect(body).toEqual({
          data,
          success: true,
          error: null
        });
      });
    });

    test('creates an error response', () => {
      const errorMessage = 'Something went wrong';
      const response = createApiResponse(null, false, errorMessage, API_STATUS.BAD_REQUEST);
      
      expect(response.status).toBe(API_STATUS.BAD_REQUEST);
      
      return response.json().then(body => {
        expect(body).toEqual({
          data: null,
          success: false,
          error: errorMessage
        });
      });
    });

    test('uses default values when not provided', () => {
      const response = createApiResponse();
      
      expect(response.status).toBe(API_STATUS.SUCCESS);
      
      return response.json().then(body => {
        expect(body).toEqual({
          data: null,
          success: true,
          error: null
        });
      });
    });
  });

  describe('handleApiError', () => {
    test('handles Error objects', () => {
      const error = new Error('Test error');
      const response = handleApiError(error);
      
      expect(response.status).toBe(API_STATUS.SERVER_ERROR);
      
      return response.json().then(body => {
        expect(body.success).toBe(false);
        expect(body.error.message).toBe('Test error');
        expect(body.error.type).toBe('GENERIC');
      });
    });

    test('handles network errors', () => {
      const error = new Error('Failed to fetch');
      const response = handleApiError(error);
      
      return response.json().then(body => {
        expect(body.error.type).toBe('NETWORK');
        expect(body.error.message).toBe(ERROR_MESSAGES.CONNECTION_ERROR);
      });
    });

    test('handles permission errors', () => {
      const error = new Error('permission denied');
      const response = handleApiError(error);
      
      expect(response.status).toBe(API_STATUS.UNAUTHORIZED);
      
      return response.json().then(body => {
        expect(body.error.type).toBe('PERMISSION');
        expect(body.error.message).toBe(ERROR_MESSAGES.PERMISSION_DENIED);
      });
    });

    test('handles authentication errors', () => {
      const error = new Error('JWT expired');
      const response = handleApiError(error);
      
      expect(response.status).toBe(API_STATUS.UNAUTHORIZED);
      
      return response.json().then(body => {
        expect(body.error.type).toBe('AUTH');
        expect(body.error.message).toBe('Your session has expired. Please sign in again.');
      });
    });

    test('handles timeout errors', () => {
      const error = new Error('timeout');
      const response = handleApiError(error);
      
      return response.json().then(body => {
        expect(body.error.type).toBe('TIMEOUT');
        expect(body.error.message).toBe('The request timed out. Please try again.');
      });
    });

    test('handles not found errors', () => {
      const error = new Error('not found');
      const response = handleApiError(error);
      
      expect(response.status).toBe(API_STATUS.NOT_FOUND);
      
      return response.json().then(body => {
        expect(body.error.type).toBe('NOT_FOUND');
        expect(body.error.message).toBe('The requested resource was not found.');
      });
    });

    test('uses default message when provided', () => {
      const error = new Error('Some error');
      const defaultMessage = 'Custom default message';
      const response = handleApiError(error, defaultMessage);
      
      return response.json().then(body => {
        expect(body.error.message).toBe('Some error');
      });
    });

    test('handles non-Error objects', () => {
      const error = { message: 'Not an Error object' };
      const response = handleApiError(error);
      
      return response.json().then(body => {
        expect(body.error.message).toBe(ERROR_MESSAGES.GENERIC);
      });
    });
  });
});