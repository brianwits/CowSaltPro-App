import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { render } from '../../../utils/test-utils';
import Dashboard from '../Dashboard';
import { dataService } from '../../../services/data';

// Mock the data service
jest.mock('../../../services/data', () => ({
  dataService: {
    getDashboardStats: jest.fn(),
  },
}));

// Mock the logger
jest.mock('../../../utils/logger', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
  logDebug: jest.fn(),
  logWarn: jest.fn(),
}));

const mockDashboardData = {
  totalSales: 1500,
  totalRevenue: 75000,
  totalCustomers: 250,
  lowStockProducts: 5,
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Mock successful API response
    (dataService.getDashboardStats as jest.Mock).mockResolvedValue(mockDashboardData);
  });

  it('renders loading state initially', () => {
    render(<Dashboard />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders dashboard cards with correct data', async () => {
    render(<Dashboard />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check if all cards are rendered with correct data
    expect(screen.getByText('Total Sales')).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('KES 75,000')).toBeInTheDocument();

    expect(screen.getByText('Total Customers')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();

    expect(screen.getByText('Low Stock Items')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('handles API error correctly', async () => {
    const errorMessage = 'Failed to fetch data';
    (dataService.getDashboardStats as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch dashboard data/)).toBeInTheDocument();
    });
  });

  it('refreshes data when refresh button is clicked', async () => {
    render(<Dashboard />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Find and click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    // Verify loading state
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Verify that getDashboardStats was called again
    expect(dataService.getDashboardStats).toHaveBeenCalledTimes(2);

    // Wait for refresh to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  it('shows last updated timestamp', async () => {
    jest.useFakeTimers();
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    
    jest.useRealTimers();
  });

  it('auto-refreshes data every 5 minutes', async () => {
    jest.useFakeTimers();
    render(<Dashboard />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Fast-forward 5 minutes
    act(() => {
      jest.advanceTimersByTime(300000);
    });

    // Verify that getDashboardStats was called again
    expect(dataService.getDashboardStats).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  // Test debug panel in development mode
  it('renders debug panel in development mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Look for debug panel button
    const debugButton = screen.getByRole('button', { name: /bug/i });
    expect(debugButton).toBeInTheDocument();

    // Click debug button and check panel content
    fireEvent.click(debugButton);
    expect(screen.getByText('Debug Panel: Dashboard')).toBeInTheDocument();

    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });

  it('does not render debug panel in production mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Debug button should not be present
    expect(screen.queryByRole('button', { name: /bug/i })).not.toBeInTheDocument();

    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });
}); 