/**
 * Unit tests for usePlantDetails hook
 *
 * Tests plant search functionality and state management
 */

import { renderHook, waitFor } from '@testing-library/react';
import { usePlantDetails } from './usePlantSearch';

// Mock global fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
global.localStorage = localStorageMock;

describe('usePlantDetails Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    localStorageMock.getItem.mockClear();
  });

  it('should initialize with null plant and loading false', () => {
    const { result } = renderHook(() => usePlantDetails(null));

    expect(result.current.plant).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch plant details successfully', async () => {
    localStorageMock.getItem.mockReturnValue('indoor');

    const mockPlant = {
      common_name: 'Snake Plant',
      scientific_name: 'Sansevieria trifasciata',
      description: 'A hardy plant',
      image_url: 'https://example.com/snake-plant.jpg',
      care_instructions: {
        light: 'Low to bright indirect',
        watering: 'Allow soil to dry',
      },
    };

    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPlant,
    });

    const { result } = renderHook(() => usePlantDetails('snake plant'));

    // Should start loading
    expect(result.current.loading).toBe(true);

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.plant).toEqual(mockPlant);
    expect(result.current.error).toBeNull();
    expect(result.current.pageTitle).toBe('Snake Plant Care Guide');
  });

  it('should handle 404 not found error', async () => {
    localStorageMock.getItem.mockReturnValue('indoor');

    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
    });

    const { result } = renderHook(() => usePlantDetails('nonexistent plant'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.plant).toBeNull();
    expect(result.current.error).toContain('not found');
  });

  it('should handle server error', async () => {
    localStorageMock.getItem.mockReturnValue('indoor');

    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => usePlantDetails('test plant'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toContain('status code: 500');
  });

  it('should handle network error', async () => {
    localStorageMock.getItem.mockReturnValue('indoor');

    global.fetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePlantDetails('test plant'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.plant).toBeNull();
  });

  it('should use plant type from localStorage', async () => {
    localStorageMock.getItem.mockReturnValue('other');

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ common_name: 'Tomato' }),
    });

    renderHook(() => usePlantDetails('tomato'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fetchUrl = global.fetch.mock.calls[0][0];
    expect(fetchUrl).toContain('type=other');
  });

  it('should default to indoor type if not set', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ common_name: 'Fern' }),
    });

    renderHook(() => usePlantDetails('fern'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fetchUrl = global.fetch.mock.calls[0][0];
    expect(fetchUrl).toContain('type=indoor');
  });

  it('should URL encode plant name', async () => {
    localStorageMock.getItem.mockReturnValue('indoor');

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ common_name: 'Peace Lily' }),
    });

    renderHook(() => usePlantDetails('peace lily'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fetchUrl = global.fetch.mock.calls[0][0];
    expect(fetchUrl).toContain('name=peace%20lily');
  });

  it('should use fallback image for missing image_url', async () => {
    localStorageMock.getItem.mockReturnValue('indoor');

    const mockPlant = {
      common_name: 'Test Plant',
      image_url: '/default_image.jpg',
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockPlant,
    });

    const { result } = renderHook(() => usePlantDetails('test plant'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.displayImageUrl).toContain('placehold.co');
  });

  it('should use actual image URL when available', async () => {
    localStorageMock.getItem.mockReturnValue('indoor');

    const mockPlant = {
      common_name: 'Test Plant',
      image_url: 'https://example.com/plant.jpg',
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockPlant,
    });

    const { result } = renderHook(() => usePlantDetails('test plant'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.displayImageUrl).toBe('https://example.com/plant.jpg');
  });

  it('should handle image error state', async () => {
    localStorageMock.getItem.mockReturnValue('indoor');

    const mockPlant = {
      common_name: 'Test Plant',
      image_url: 'https://example.com/plant.jpg',
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockPlant,
    });

    const { result } = renderHook(() => usePlantDetails('test plant'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Simulate image error
    result.current.setImageError(true);

    await waitFor(() => {
      expect(result.current.displayImageUrl).toContain('placehold.co');
    });
  });

  it('should not fetch when plantName is empty', () => {
    renderHook(() => usePlantDetails(''));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should not fetch when plantName is null', () => {
    renderHook(() => usePlantDetails(null));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should refetch when plantName changes', async () => {
    localStorageMock.getItem.mockReturnValue('indoor');

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ common_name: 'Plant 1' }),
    });

    const { rerender } = renderHook(
      ({ name }) => usePlantDetails(name),
      { initialProps: { name: 'plant1' } }
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Change plant name
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ common_name: 'Plant 2' }),
    });

    rerender({ name: 'plant2' });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
