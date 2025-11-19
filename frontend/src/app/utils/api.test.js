import { authenticatedFetch, apiGet, apiPost, apiPut, apiDelete } from './api';

// Mock global fetch
global.fetch = jest.fn();

// Setup localStorage mock
Storage.prototype.getItem = jest.fn();
Storage.prototype.setItem = jest.fn();
Storage.prototype.removeItem = jest.fn();
Storage.prototype.clear = jest.fn();

// Mock window.dispatchEvent
window.dispatchEvent = jest.fn();

describe('API Utilities', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('authenticatedFetch', () => {
    it('should include Authorization header when token exists', async () => {
      const mockToken = 'test-token-123';
      Storage.prototype.getItem.mockReturnValue(mockToken);

      fetch.mockResolvedValue({
        status: 200,
        json: async () => ({ success: true }),
      });

      await authenticatedFetch('/test-endpoint');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/v1/test-endpoint',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should not include Authorization header when token does not exist', async () => {
      Storage.prototype.getItem.mockReturnValue(null);

      fetch.mockResolvedValue({
        status: 200,
        json: async () => ({ success: true }),
      });

      await authenticatedFetch('/test-endpoint');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/v1/test-endpoint',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle 401 Unauthorized by clearing storage and dispatching event', async () => {
      Storage.prototype.getItem.mockReturnValue('test-token');

      fetch.mockResolvedValue({
        status: 401,
      });

      await expect(authenticatedFetch('/test-endpoint')).rejects.toThrow(
        'Session expired. Please log in again.'
      );

      expect(localStorage.removeItem).toHaveBeenCalledWith('supabase.token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('supabase.userId');
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'sessionExpiredMessage',
        'Your session has expired. Please log in again.'
      );
      expect(window.dispatchEvent).toHaveBeenCalled();
      // Note: window.location.href redirection is not tested due to jsdom limitations
    });

    it('should merge custom headers with default headers', async () => {
      Storage.prototype.getItem.mockReturnValue(null);

      fetch.mockResolvedValue({
        status: 200,
        json: async () => ({ success: true }),
      });

      await authenticatedFetch('/test-endpoint', {
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/v1/test-endpoint',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
    });
  });

  describe('apiGet', () => {
    it('should make a GET request and return JSON response', async () => {
      const mockData = { id: 1, name: 'Test' };

      fetch.mockResolvedValue({
        status: 200,
        json: async () => mockData,
      });

      const result = await apiGet('/test-endpoint');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/v1/test-endpoint',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('apiPost', () => {
    it('should make a POST request with data and return JSON response', async () => {
      const mockData = { name: 'New Item' };
      const mockResponse = { id: 1, ...mockData };

      fetch.mockResolvedValue({
        status: 201,
        json: async () => mockResponse,
      });

      const result = await apiPost('/test-endpoint', mockData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/v1/test-endpoint',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockData),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('apiPut', () => {
    it('should make a PUT request with data and return JSON response', async () => {
      const mockData = { name: 'Updated Item' };
      const mockResponse = { id: 1, ...mockData };

      fetch.mockResolvedValue({
        status: 200,
        json: async () => mockResponse,
      });

      const result = await apiPut('/test-endpoint', mockData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/v1/test-endpoint',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(mockData),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('apiDelete', () => {
    it('should make a DELETE request and return JSON response', async () => {
      const mockResponse = { success: true };

      fetch.mockResolvedValue({
        status: 200,
        json: async () => mockResponse,
      });

      const result = await apiDelete('/test-endpoint');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/v1/test-endpoint',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
