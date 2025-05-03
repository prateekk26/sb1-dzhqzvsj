import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../../store/useAuthStore';
import { vi } from 'vitest';

// Reset the store before each test
beforeEach(() => {
  act(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      profile: null,
      loading: false,
      initialized: false,
      error: null,
      bypassProfile: false
    });
  });
});

// Mock the Supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockImplementation(({ email, password }) => {
        if (email === 'valid@example.com' && password === 'ValidPassword123') {
          return Promise.resolve({
            data: {
              user: { id: 'user-123', email },
              session: { access_token: 'token-123' }
            },
            error: null
          });
        }
        return Promise.resolve({
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials' }
        });
      }),
      signUp: vi.fn().mockImplementation(({ email, password }) => {
        if (email === 'new@example.com') {
          return Promise.resolve({
            data: {
              user: { id: 'new-user-123', email },
              session: null // Simulating email confirmation required
            },
            error: null
          });
        }
        return Promise.resolve({
          data: { user: null },
          error: { message: 'Email already registered' }
        });
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null
      })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null
      })
    })
  }
}));

describe('useAuthStore', () => {
  test('should initialize with default values', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.initialized).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.bypassProfile).toBe(false);
  });

  test('should sign in with valid credentials', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    await act(async () => {
      await result.current.signIn('valid@example.com', 'ValidPassword123');
    });
    
    expect(result.current.user).toEqual({ id: 'user-123', email: 'valid@example.com' });
    expect(result.current.session).toEqual({ access_token: 'token-123' });
    expect(result.current.error).toBeNull();
  });

  test('should handle sign in errors', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    await act(async () => {
      const response = await result.current.signIn('invalid@example.com', 'WrongPassword');
      expect(response.error).toEqual({ message: 'Invalid login credentials' });
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  test('should sign up new user', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    await act(async () => {
      const response = await result.current.signUp('new@example.com', 'Password123');
      expect(response.error).toBeNull();
      expect(response.user).toEqual({ id: 'new-user-123', email: 'new@example.com' });
    });
    
    expect(result.current.user).toEqual({ id: 'new-user-123', email: 'new@example.com' });
  });

  test('should handle sign up errors', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    await act(async () => {
      const response = await result.current.signUp('existing@example.com', 'Password123');
      expect(response.error).toEqual({ message: 'Email already registered' });
    });
  });

  test('should sign out user', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    // First sign in
    await act(async () => {
      await result.current.signIn('valid@example.com', 'ValidPassword123');
    });
    
    expect(result.current.user).not.toBeNull();
    
    // Then sign out
    await act(async () => {
      await result.current.signOut();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  test('should refresh session', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    // Mock getSession to return a session
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: {
        session: { 
          access_token: 'refreshed-token',
          user: { id: 'user-123', email: 'user@example.com' }
        }
      },
      error: null
    });
    
    await act(async () => {
      await result.current.refreshSession();
    });
    
    expect(result.current.user).toEqual({ id: 'user-123', email: 'user@example.com' });
    expect(result.current.session).toEqual({ 
      access_token: 'refreshed-token',
      user: { id: 'user-123', email: 'user@example.com' }
    });
    expect(result.current.initialized).toBe(true);
  });

  test('should check if profile is complete', () => {
    const { result } = renderHook(() => useAuthStore());
    
    // Set bypass to true
    act(() => {
      result.current.bypassProfileCompletion(true);
    });
    
    expect(result.current.isProfileComplete()).toBe(true);
    
    // Set bypass to false and test with incomplete profile
    act(() => {
      result.current.bypassProfileCompletion(false);
      result.current.setProfile({
        firstName: 'John',
        lastName: null,
        linkedinUrl: null,
        resumeUrl: null,
        email: 'john@example.com'
      });
    });
    
    expect(result.current.isProfileComplete()).toBe(false);
    
    // Test with complete profile
    act(() => {
      result.current.setProfile({
        firstName: 'John',
        lastName: 'Doe',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        resumeUrl: 'https://example.com/resume.pdf',
        email: 'john@example.com'
      });
    });
    
    expect(result.current.isProfileComplete()).toBe(true);
  });
});