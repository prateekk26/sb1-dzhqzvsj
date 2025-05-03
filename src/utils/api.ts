/**
 * API utility functions for making requests and handling responses
 */
import { supabase } from '../lib/supabase';
import { API_STATUS, ApiResponse, ERROR_MESSAGES, ErrorType } from './types';

/**
 * Generic function to handle API requests with error handling
 */
export async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  const startTime = performance.now();
  
  try {
    console.log(`Making ${method} request to ${endpoint}`);
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Get auth token if available
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.access_token) {
        defaultHeaders['Authorization'] = `Bearer ${sessionData.session.access_token}`;
      }
    } catch (authError) {
      console.warn('Authentication error when preparing API request:', authError);
    }
    
    // Determine if this is a Supabase Edge Function call
    if (endpoint.startsWith('/functions/') || endpoint.includes('functions/v1/')) {
      const functionName = endpoint.split('/').pop() || '';
      console.log(`Calling Supabase Edge Function: ${functionName}`);
      
      const { data: result, error } = await supabase.functions.invoke(functionName, {
        body: data,
        headers: {
          ...headers
        }
      });
      
      const endTime = performance.now();
      console.log(`Edge Function ${functionName} completed in ${Math.round(endTime - startTime)}ms`);
      
      if (error) {
        return {
          success: false,
          error: error.message || 'Edge Function error'
        };
      }
      
      return {
        success: true,
        data: result as T
      };
    } else {
      // Regular fetch for non-Edge Function endpoints
      const response = await fetch(endpoint, {
        method,
        headers: {
          ...defaultHeaders,
          ...headers
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      const endTime = performance.now();
      console.log(`${method} ${endpoint} completed in ${Math.round(endTime - startTime)}ms with status ${response.status}`);

      // Try to get the response as text first
      let responseText;
      let responseData;

      try {
        responseText = await response.text();
        
        // Try to parse as JSON if possible
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          console.warn('Response is not valid JSON:', responseText.substring(0, 100));
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
        }
      } catch (parseError) {
        console.error('Error parsing API response:', parseError);
        throw new Error(`Failed to parse API response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

      if (!response.ok) {
        // Extract error message from the response if available
        const errorMessage = responseData?.error || 
                             responseData?.message || 
                             `Error: ${response.status} ${response.statusText}`;
                             
        return {
          success: false,
          error: errorMessage,
        };
      }

      return {
        success: true,
        data: responseData,
      };
    }
  } catch (error) {
    const endTime = performance.now();
    console.error(`API request to ${endpoint} failed after ${Math.round(endTime - startTime)}ms:`, error);
    console.log(`Request details: ${method} ${endpoint}`);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC
    };
  }
}

/**
 * Helper function to generate a clean API response
 */
export function createApiResponse<T>(
  data: T | null = null,
  success: boolean = true,
  error: string | null = null,
  status: number = API_STATUS.SUCCESS
): Response {
  const body = {
    data,
    success,
    error,
  };
  
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: any, defaultMessage: string = ERROR_MESSAGES.GENERIC): Response {
  console.error('API error handler received:', error);
  
  // Determine error type for better handling
  let errorType: ErrorType = 'GENERIC';
  let errorMessage: string = defaultMessage;
  let statusCode: number = API_STATUS.SERVER_ERROR;
  let errorDetails: string | null = null;
  
  if (error instanceof Error) {
    errorDetails = error.stack || null;
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      errorMessage = ERROR_MESSAGES.CONNECTION_ERROR;
      errorType = 'NETWORK';
    } else if (error.message.includes('permission') || error.message.includes('not allowed')) {
      errorMessage = ERROR_MESSAGES.PERMISSION_DENIED;
      statusCode = API_STATUS.UNAUTHORIZED;
      errorType = 'PERMISSION';
    } else if (error.message.includes('Invalid Refresh Token') || 
               error.message.includes('refresh_token_not_found') ||
               error.message.includes('JWT expired') ||
               error.message.includes('session expired')) {
      errorMessage = 'Your session has expired. Please sign in again.';
      statusCode = API_STATUS.UNAUTHORIZED;
      errorType = 'AUTH';
      
      // Attempt to sign out the user and redirect to home page
      try {
        supabase.auth.signOut().then(() => {
          window.location.href = '/';
        });
      } catch (e) {
        console.error('Failed to sign out user after auth error:', e);
      }
    } else if (error.message.includes('timeout') || error.message.includes('aborted')) {
      errorMessage = 'The request timed out. Please try again.';
      errorType = 'TIMEOUT';
    } else if (error.message.includes('not found') || error.message.includes('404')) {
      errorMessage = 'The requested resource was not found.';
      statusCode = API_STATUS.NOT_FOUND;
      errorType = 'NOT_FOUND';
    } else {
      errorMessage = error.message;
    }
  }
  
  // Log detailed error information
  console.error(`API Error [${errorType}]: ${errorMessage}`, {
    statusCode,
    details: errorDetails,
    originalError: error
  });
  
  return createApiResponse(
    null,
    false,
    {
      message: errorMessage,
      type: errorType,
      details: errorDetails,
      timestamp: new Date().toISOString()
    },
    statusCode
  );
}