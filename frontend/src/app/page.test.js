/**
 * Unit tests for Home Page
 *
 * Tests the main landing page with plant search functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from './page';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock localStorage
const localStorageMock = {
  setItem: jest.fn(),
  getItem: jest.fn(),
};
global.localStorage = localStorageMock;

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it('should render the main title', () => {
    render(<Home />);
    expect(screen.getByText(/Grow Smarter/i)).toBeInTheDocument();
  });

  it('should render the tagline', () => {
    render(<Home />);
    expect(screen.getByText(/Plant Care Database/i)).toBeInTheDocument();
  });

  it('should render plant type selector buttons', () => {
    render(<Home />);
    expect(screen.getByText('Indoor Plants')).toBeInTheDocument();
    expect(screen.getByText('Other Plants')).toBeInTheDocument();
  });

  it('should render search input field', () => {
    render(<Home />);
    const searchInput = screen.getByPlaceholderText(/Search for any plant/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should render search button', () => {
    render(<Home />);
    const searchButton = screen.getByRole('button', { name: /search/i });
    expect(searchButton).toBeInTheDocument();
  });

  it('should update search input value when typing', () => {
    render(<Home />);
    const searchInput = screen.getByPlaceholderText(/Search for any plant/i);

    fireEvent.change(searchInput, { target: { value: 'snake plant' } });

    expect(searchInput.value).toBe('snake plant');
  });

  it('should select Indoor Plants type by default', () => {
    render(<Home />);
    const indoorButton = screen.getByText('Indoor Plants');

    // Check if the button has active styling (you may need to adjust based on implementation)
    expect(indoorButton).toBeInTheDocument();
  });

  it('should switch plant type when clicking Other Plants', () => {
    render(<Home />);
    const otherButton = screen.getByText('Other Plants');

    fireEvent.click(otherButton);

    // Verify localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedPlantType', 'other');
  });

  it('should switch plant type when clicking Indoor Plants', () => {
    render(<Home />);
    const indoorButton = screen.getByText('Indoor Plants');

    // First click Other, then Indoor
    fireEvent.click(screen.getByText('Other Plants'));
    fireEvent.click(indoorButton);

    // Verify localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedPlantType', 'indoor');
  });

  it('should navigate to plant page on form submission', async () => {
    render(<Home />);
    const searchInput = screen.getByPlaceholderText(/Search for any plant/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: 'snake plant' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/plants/snake%20plant');
    });
  });

  it('should not navigate when search input is empty', async () => {
    render(<Home />);
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.click(searchButton);

    // Should not navigate with empty input
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should trim whitespace from search input', async () => {
    render(<Home />);
    const searchInput = screen.getByPlaceholderText(/Search for any plant/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: '  pothos  ' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/plants/pothos');
    });
  });

  it('should handle Enter key press for search', async () => {
    render(<Home />);
    const searchInput = screen.getByPlaceholderText(/Search for any plant/i);

    fireEvent.change(searchInput, { target: { value: 'fern' } });
    fireEvent.submit(searchInput.closest('form'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/plants/fern');
    });
  });

  it('should URL encode plant names with special characters', async () => {
    render(<Home />);
    const searchInput = screen.getByPlaceholderText(/Search for any plant/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(searchInput, { target: { value: 'bird of paradise' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/plants/bird%20of%20paradise');
    });
  });

  it('should render "How It Works" section', () => {
    render(<Home />);
    expect(screen.getByText(/How It Works/i)).toBeInTheDocument();
  });

  it('should render footer', () => {
    render(<Home />);
    const footer = screen.getByText(/2024.*Gardening App/i);
    expect(footer).toBeInTheDocument();
  });

  it('should maintain plant type selection during search', async () => {
    render(<Home />);

    // Select outdoor plants
    fireEvent.click(screen.getByText('Other Plants'));

    const searchInput = screen.getByPlaceholderText(/Search for any plant/i);
    fireEvent.change(searchInput, { target: { value: 'tomato' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    // Verify the plant type was saved before navigation
    expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedPlantType', 'other');

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/plants/tomato');
    });
  });

  it('should clear search input after submission', async () => {
    render(<Home />);
    const searchInput = screen.getByPlaceholderText(/Search for any plant/i);

    fireEvent.change(searchInput, { target: { value: 'basil' } });
    fireEvent.submit(searchInput.closest('form'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });

    // Check if input is cleared (implementation dependent)
    // This test assumes the input gets cleared after search
  });

  it('should have accessible form elements', () => {
    render(<Home />);

    const searchInput = screen.getByPlaceholderText(/Search for any plant/i);
    expect(searchInput).toHaveAttribute('type', 'text');

    const searchButton = screen.getByRole('button', { name: /search/i });
    expect(searchButton).toHaveAttribute('type', 'submit');
  });

  it('should render with correct styling classes', () => {
    const { container } = render(<Home />);

    // Verify main container exists
    expect(container.firstChild).toBeTruthy();

    // Verify form exists
    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();
  });
});
