/**
 * Unit tests for useCollections hook
 *
 * Tests collection management, deletion, and renaming functionality
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useCollections } from './useCollections';
import * as api from '../utils/api';

// Mock the API module
jest.mock('../utils/api');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window methods
global.confirm = jest.fn();
global.alert = jest.fn();
window.dispatchEvent = jest.fn();

describe('useCollections Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.confirm.mockReturnValue(true); // Default to confirming actions
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'supabase.token') return 'test-token';
      if (key === 'supabase.userId') return 'user-123';
      return null;
    });
  });

  it('should initialize with empty collections and loading state', () => {
    api.authenticatedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    });

    const { result } = renderHook(() => useCollections());

    expect(result.current.collections).toEqual({});
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should fetch collections successfully', async () => {
    const mockCollections = {
      'Indoor Plants': [
        { id: 1, common_name: 'Snake Plant', collection_id: 1 },
        { id: 2, common_name: 'Pothos', collection_id: 1 },
      ],
      'Outdoor Garden': [
        { id: 3, common_name: 'Tomato', collection_id: 2 },
      ],
    };

    api.authenticatedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockCollections }),
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.collections).toEqual(mockCollections);
    expect(result.current.error).toBeNull();
    expect(result.current.userId).toBe('user-123');
  });

  it('should handle empty collections', async () => {
    api.authenticatedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.collections).toEqual({});
    expect(result.current.error).toBeNull();
  });

  it('should handle missing token', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.userId).toBeNull();
    expect(api.authenticatedFetch).not.toHaveBeenCalled();
  });

  it('should handle 500 server error', async () => {
    api.authenticatedFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Server error' }),
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toContain('Critical Server Crash');
    expect(result.current.collections).toEqual({});
  });

  it('should handle network error', async () => {
    api.authenticatedFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.collections).toEqual({});
  });

  it('should handle session expired error', async () => {
    api.authenticatedFetch.mockRejectedValue(new Error('Session expired'));

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should not set error for session expiration (handled by api.js)
    expect(result.current.collections).toEqual({});
  });

  describe('refreshCollections', () => {
    it('should refetch collections when called', async () => {
      api.authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { 'Test': [] } }),
      });

      const { result } = renderHook(() => useCollections());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear the mock calls
      api.authenticatedFetch.mockClear();

      // Update mock response
      api.authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { 'Updated': [] } }),
      });

      // Call refresh
      act(() => {
        result.current.refreshCollections();
      });

      await waitFor(() => {
        expect(api.authenticatedFetch).toHaveBeenCalled();
      });
    });

    it('should dispatch storage change event', async () => {
      api.authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      const { result } = renderHook(() => useCollections());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.refreshCollections();
      });

      expect(window.dispatchEvent).toHaveBeenCalled();
    });
  });

  describe('deleteCollection', () => {
    it('should delete collection successfully', async () => {
      const mockCollections = {
        'Test Collection': [
          { id: 1, common_name: 'Plant 1', collection_id: 1 },
        ],
      };

      api.authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockCollections }),
      });

      const { result } = renderHook(() => useCollections());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock delete response
      api.authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Deleted' }),
      });

      await act(async () => {
        await result.current.deleteCollection('Test Collection');
      });

      expect(global.confirm).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith(
        'Collection "Test Collection" deleted successfully.'
      );
    });

    it('should not delete if user cancels confirmation', async () => {
      global.confirm.mockReturnValue(false);

      const mockCollections = {
        'Test Collection': [{ id: 1, common_name: 'Plant 1' }],
      };

      api.authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockCollections }),
      });

      const { result } = renderHook(() => useCollections());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const deleteCalls = api.authenticatedFetch.mock.calls.length;

      await act(async () => {
        await result.current.deleteCollection('Test Collection');
      });

      // Should not make additional fetch call
      expect(api.authenticatedFetch).toHaveBeenCalledTimes(deleteCalls);
    });

    it('should handle delete error', async () => {
      const mockCollections = {
        'Test Collection': [{ id: 1, common_name: 'Plant 1' }],
      };

      api.authenticatedFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockCollections }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: 'Delete failed' }),
        });

      const { result } = renderHook(() => useCollections());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteCollection('Test Collection');
      });

      expect(global.alert).toHaveBeenCalledWith('Error: Delete failed');
    });
  });

  describe('renameCollection', () => {
    it('should rename collection successfully', async () => {
      api.authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      const { result } = renderHook(() => useCollections());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock rename response
      api.authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Renamed successfully' }),
      });

      let renameResult;
      await act(async () => {
        renameResult = await result.current.renameCollection('Old Name', 'New Name');
      });

      expect(renameResult.success).toBe(true);
    });

    it('should reject empty new name', async () => {
      api.authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      const { result } = renderHook(() => useCollections());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let renameResult;
      await act(async () => {
        renameResult = await result.current.renameCollection('Old Name', '   ');
      });

      expect(renameResult.success).toBe(false);
      expect(global.alert).toHaveBeenCalledWith('New collection name cannot be empty.');
    });

    it('should reject same name', async () => {
      api.authenticatedFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });

      const { result } = renderHook(() => useCollections());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let renameResult;
      await act(async () => {
        renameResult = await result.current.renameCollection('Same Name', 'Same Name');
      });

      expect(renameResult.success).toBe(false);
      expect(global.alert).toHaveBeenCalledWith(
        'New name must be different from the old name.'
      );
    });

    it('should handle duplicate name error (409)', async () => {
      api.authenticatedFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: {} }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: async () => ({ message: 'Name already exists' }),
        });

      const { result } = renderHook(() => useCollections());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let renameResult;
      await act(async () => {
        renameResult = await result.current.renameCollection('Old', 'Existing');
      });

      expect(renameResult.success).toBe(false);
      expect(renameResult.message).toContain('already exists');
    });

    it('should handle not found error (404)', async () => {
      api.authenticatedFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: {} }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ message: 'Collection not found' }),
        });

      const { result } = renderHook(() => useCollections());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let renameResult;
      await act(async () => {
        renameResult = await result.current.renameCollection('Missing', 'New');
      });

      expect(renameResult.success).toBe(false);
      expect(renameResult.message).toContain('not found');
    });

    it('should trim whitespace from new name', async () => {
      api.authenticatedFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: {} }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Success' }),
        });

      const { result } = renderHook(() => useCollections());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.renameCollection('Old', '  New Name  ');
      });

      // Check that the API was called with trimmed name
      expect(api.authenticatedFetch).toHaveBeenCalledWith(
        '/collections/rename',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            old_name: 'Old',
            new_name: 'New Name',
          }),
        })
      );
    });
  });

  it('should handle nested data structure', async () => {
    const mockResponse = {
      status: 'success',
      data: {
        'Collection 1': [{ id: 1, common_name: 'Plant 1' }],
      },
    };

    api.authenticatedFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.collections).toEqual(mockResponse.data);
  });

  it('should handle flat data structure (fallback)', async () => {
    const mockCollections = {
      'Collection 1': [{ id: 1, common_name: 'Plant 1' }],
    };

    api.authenticatedFetch.mockResolvedValue({
      ok: true,
      json: async () => mockCollections,
    });

    const { result } = renderHook(() => useCollections());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.collections).toEqual(mockCollections);
  });
});
