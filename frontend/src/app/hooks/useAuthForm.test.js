/**
 * Unit tests for useAuthForm hook
 *
 * Tests authentication flow including login and signup
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthForm } from './useAuthForm';

// Mock Next.js router
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock global fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window methods
global.alert = jest.fn();
window.dispatchEvent = jest.fn();

describe('useAuthForm Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    mockPush.mockClear();
    mockRefresh.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useAuthForm());

    expect(result.current.email).toBe('');
    expect(result.current.password).toBe('');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should update email state', () => {
    const { result } = renderHook(() => useAuthForm());

    act(() => {
      result.current.setEmail('test@example.com');
    });

    expect(result.current.email).toBe('test@example.com');
  });

  it('should update password state', () => {
    const { result } = renderHook(() => useAuthForm());

    act(() => {
      result.current.setPassword('password123');
    });

    expect(result.current.password).toBe('password123');
  });

  describe('Login', () => {
    it('should handle successful login', async () => {
      const mockResponse = {
        token: 'test-jwt-token',
        user_id: 'user-123',
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useAuthForm());

      act(() => {
        result.current.setEmail('test@example.com');
        result.current.setPassword('password123');
      });

      const mockEvent = { preventDefault: jest.fn() };

      await act(async () => {
        await result.current.handleAuth(mockEvent, true); // true = login mode
      });

      // Verify API call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/v1/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      );

      // Verify token storage
      expect(localStorageMock.setItem).toHaveBeenCalledWith('supabase.token', 'test-jwt-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('supabase.userId', 'user-123');

      // Verify navigation
      expect(mockRefresh).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/collections');

      // Verify storage event dispatched
      expect(window.dispatchEvent).toHaveBeenCalled();

      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle login failure with invalid credentials', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' }),
      });

      const { result } = renderHook(() => useAuthForm());

      act(() => {
        result.current.setEmail('test@example.com');
        result.current.setPassword('wrongpassword');
      });

      const mockEvent = { preventDefault: jest.fn() };

      await act(async () => {
        await result.current.handleAuth(mockEvent, true);
      });

      expect(result.current.error).toBe('Invalid credentials');
      expect(result.current.isLoading).toBe(false);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle network error during login', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuthForm());

      act(() => {
        result.current.setEmail('test@example.com');
        result.current.setPassword('password123');
      });

      const mockEvent = { preventDefault: jest.fn() };

      await act(async () => {
        await result.current.handleAuth(mockEvent, true);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle server error (500)', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useAuthForm());

      const mockEvent = { preventDefault: jest.fn() };

      await act(async () => {
        await result.current.handleAuth(mockEvent, true);
      });

      expect(result.current.error).toContain('Server error');
    });
  });

  describe('Sign Up', () => {
    it('should handle successful signup with auto-login', async () => {
      // Mock signup response
      const signupResponse = {
        message: 'User created successfully',
      };

      // Mock auto-login response
      const loginResponse = {
        token: 'new-user-token',
        user_id: 'new-user-123',
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => signupResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => loginResponse,
        });

      const { result } = renderHook(() => useAuthForm());

      act(() => {
        result.current.setEmail('newuser@example.com');
        result.current.setPassword('password123');
      });

      const mockEvent = { preventDefault: jest.fn() };

      await act(async () => {
        await result.current.handleAuth(mockEvent, false); // false = signup mode
      });

      // Verify signup API call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/v1/auth/signup',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'newuser@example.com',
            password: 'password123',
          }),
        })
      );

      // Verify auto-login call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/v1/auth/login',
        expect.any(Object)
      );

      // Verify token storage
      expect(localStorageMock.setItem).toHaveBeenCalledWith('supabase.token', 'new-user-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('supabase.userId', 'new-user-123');

      // Verify alert shown
      expect(global.alert).toHaveBeenCalledWith(
        'Sign Up successful! Attempting automatic sign-in...'
      );

      // Verify navigation
      expect(mockPush).toHaveBeenCalledWith('/collections');
    });

    it('should handle signup failure (duplicate email)', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Email already exists' }),
      });

      const { result } = renderHook(() => useAuthForm());

      act(() => {
        result.current.setEmail('existing@example.com');
        result.current.setPassword('password123');
      });

      const mockEvent = { preventDefault: jest.fn() };

      await act(async () => {
        await result.current.handleAuth(mockEvent, false);
      });

      expect(result.current.error).toBe('Email already exists');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle signup success but auto-login failure', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'User created' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Login failed' }),
        });

      const { result } = renderHook(() => useAuthForm());

      act(() => {
        result.current.setEmail('newuser@example.com');
        result.current.setPassword('password123');
      });

      const mockEvent = { preventDefault: jest.fn() };

      await act(async () => {
        await result.current.handleAuth(mockEvent, false);
      });

      expect(result.current.error).toContain('automatic login failed');
    });
  });

  describe('Form Handling', () => {
    it('should prevent default form submission', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'test', user_id: 'user' }),
      });

      const { result } = renderHook(() => useAuthForm());

      const mockEvent = { preventDefault: jest.fn() };

      await act(async () => {
        await result.current.handleAuth(mockEvent, true);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should clear error on new submission', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'First error' }),
      });

      const { result } = renderHook(() => useAuthForm());

      const mockEvent = { preventDefault: jest.fn() };

      // First submission with error
      await act(async () => {
        await result.current.handleAuth(mockEvent, true);
      });

      expect(result.current.error).toBe('First error');

      // Second submission should clear error initially
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'test', user_id: 'user' }),
      });

      await act(async () => {
        await result.current.handleAuth(mockEvent, true);
      });

      expect(result.current.error).toBeNull();
    });

    it('should set loading state during authentication', async () => {
      let resolvePromise;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      global.fetch.mockReturnValue(promise);

      const { result } = renderHook(() => useAuthForm());

      const mockEvent = { preventDefault: jest.fn() };

      act(() => {
        result.current.handleAuth(mockEvent, true);
      });

      // Should be loading immediately
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise({
          ok: true,
          json: async () => ({ token: 'test', user_id: 'user' }),
        });
        await promise;
      });

      // Should no longer be loading
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should handle malformed JSON error (Flask crash)', async () => {
      global.fetch.mockRejectedValue(new Error("Unexpected token '<' in JSON"));

      const { result } = renderHook(() => useAuthForm());

      const mockEvent = { preventDefault: jest.fn() };

      await act(async () => {
        await result.current.handleAuth(mockEvent, true);
      });

      expect(result.current.error).toContain('Server communication failed');
      expect(result.current.error).toContain('Flask is running');
    });

    it('should provide default error message for unknown errors', async () => {
      global.fetch.mockRejectedValue(new Error());

      const { result } = renderHook(() => useAuthForm());

      const mockEvent = { preventDefault: jest.fn() };

      await act(async () => {
        await result.current.handleAuth(mockEvent, true);
      });

      expect(result.current.error).toBe('An unknown error occurred.');
    });
  });
});
