import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../../../utils/test-utils';
import DebugPanel from '../DebugPanel';
import { logDebug } from '../../../utils/logger';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NotificationProvider } from '../../context/NotificationContext';

// Mock the logger
vi.mock('../../../utils/logger', () => ({
  logDebug: vi.fn(),
}));

describe('DebugPanel Component', () => {
  const mockState = {
    count: 0,
    loading: false,
    error: null,
  };

  const mockActions = [
    {
      name: 'Increment',
      handler: vi.fn(),
    },
    {
      name: 'Reset',
      handler: vi.fn(),
    },
  ];

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <NotificationProvider>
        {component}
      </NotificationProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set environment to development
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing in production mode', () => {
    process.env.NODE_ENV = 'production';
    renderWithProviders(<DebugPanel componentName="TestComponent" state={mockState} actions={mockActions} />);
    expect(screen.queryByRole('button', { name: /bug/i })).not.toBeInTheDocument();
  });

  it('renders debug button in development mode', () => {
    renderWithProviders(<DebugPanel componentName="TestComponent" state={mockState} actions={mockActions} />);
    expect(screen.getByRole('button', { name: /bug/i })).toBeInTheDocument();
  });

  it('opens debug panel when button is clicked', () => {
    renderWithProviders(<DebugPanel componentName="TestComponent" state={mockState} actions={mockActions} />);
    const debugButton = screen.getByRole('button', { name: /bug/i });
    fireEvent.click(debugButton);
    expect(screen.getByText('Debug Panel: TestComponent')).toBeInTheDocument();
  });

  it('displays component state correctly', () => {
    renderWithProviders(<DebugPanel componentName="TestComponent" state={mockState} actions={mockActions} />);
    const debugButton = screen.getByRole('button', { name: /bug/i });
    fireEvent.click(debugButton);

    // Check if state values are displayed
    expect(screen.getByText('count')).toBeInTheDocument();
    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(screen.getByText('error')).toBeInTheDocument();
  });

  it('renders and handles debug actions', () => {
    renderWithProviders(<DebugPanel componentName="TestComponent" state={mockState} actions={mockActions} />);
    const debugButton = screen.getByRole('button', { name: /bug/i });
    fireEvent.click(debugButton);

    // Check if action buttons are rendered
    const incrementButton = screen.getByText('Increment');
    const resetButton = screen.getByText('Reset');
    expect(incrementButton).toBeInTheDocument();
    expect(resetButton).toBeInTheDocument();

    // Click actions and verify handlers are called
    fireEvent.click(incrementButton);
    expect(mockActions[0].handler).toHaveBeenCalled();
    expect(logDebug).toHaveBeenCalledWith('Debug action triggered: Increment');

    fireEvent.click(resetButton);
    expect(mockActions[1].handler).toHaveBeenCalled();
    expect(logDebug).toHaveBeenCalledWith('Debug action triggered: Reset');
  });

  it('simulates slow network when toggle is switched', async () => {
    renderWithProviders(<DebugPanel componentName="TestComponent" state={mockState} actions={mockActions} />);
    const debugButton = screen.getByRole('button', { name: /bug/i });
    fireEvent.click(debugButton);

    const networkToggle = screen.getByRole('checkbox', { name: /simulate slow network/i });
    expect(networkToggle).not.toBeChecked();

    // Enable slow network
    fireEvent.click(networkToggle);
    expect(networkToggle).toBeChecked();
    expect(logDebug).toHaveBeenCalledWith('Slow network simulation enabled');

    // Disable slow network
    fireEvent.click(networkToggle);
    expect(networkToggle).not.toBeChecked();
    expect(logDebug).toHaveBeenCalledWith('Slow network simulation disabled');
  });

  it('tracks performance metrics when panel is open', async () => {
    renderWithProviders(<DebugPanel componentName="TestComponent" state={mockState} actions={mockActions} />);
    const debugButton = screen.getByRole('button', { name: /bug/i });
    fireEvent.click(debugButton);

    // Wait for performance metrics to be displayed
    await waitFor(() => {
      expect(screen.getByText('FPS')).toBeInTheDocument();
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('Render Count')).toBeInTheDocument();
    });
  });

  it('tracks network requests', async () => {
    // Mock fetch
    const mockFetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
      }))
    );
    global.fetch = mockFetch;

    renderWithProviders(<DebugPanel componentName="TestComponent" state={mockState} actions={mockActions} />);
    const debugButton = screen.getByRole('button', { name: /bug/i });
    fireEvent.click(debugButton);

    // Simulate a fetch request
    await fetch('https://api.example.com/data');

    // Check if request is logged in the panel
    await waitFor(() => {
      expect(screen.getByText(/GET/)).toBeInTheDocument();
      expect(screen.getByText(/api\.example\.com/)).toBeInTheDocument();
    });
  });

  it('closes panel when close button is clicked', () => {
    renderWithProviders(<DebugPanel componentName="TestComponent" state={mockState} actions={mockActions} />);
    const debugButton = screen.getByRole('button', { name: /bug/i });
    fireEvent.click(debugButton);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(screen.queryByText('Debug Panel: TestComponent')).not.toBeInTheDocument();
  });
}); 