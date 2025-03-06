import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from '../App';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  HashRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Routes: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Route: ({ element }: { element: React.ReactNode }) => <>{element}</>,
}));

// Mock the child components
vi.mock('../components/Navigation', () => ({
  default: () => <div data-testid="mock-navigation">Navigation</div>,
}));

vi.mock('../pages/Dashboard', () => ({
  default: () => <div data-testid="mock-dashboard">Dashboard</div>,
}));

vi.mock('../pages/Inventory', () => ({
  default: () => <div data-testid="mock-inventory">Inventory</div>,
}));

vi.mock('../pages/POS', () => ({
  default: () => <div data-testid="mock-pos">POS</div>,
}));

vi.mock('../pages/Reports', () => ({
  default: () => <div data-testid="mock-reports">Reports</div>,
}));

vi.mock('../pages/Settings', () => ({
  default: () => <div data-testid="mock-settings">Settings</div>,
}));

// Mock the debug panel without auto-executing actions
vi.mock('../components/DebugPanel', () => ({
  default: ({ componentName, actions }: { componentName: string; actions: any[] }) => (
    <div data-testid="mock-debug-panel">
      Debug Panel: {componentName}
      {actions.map((action, index) => (
        <button
          key={index}
          data-testid={`debug-action-${action.name.toLowerCase().replace(/\s+/g, '-')}`}
          onClick={action.handler}
        >
          {action.name}
        </button>
      ))}
    </div>
  ),
}));

describe('App Component', () => {
  beforeEach(() => {
    // Reset environment and mocks before each test
    process.env.NODE_ENV = 'development';
    vi.clearAllMocks();
    
    // Mock window.location.reload
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('mock-navigation')).toBeInTheDocument();
  });

  it('renders dashboard by default', () => {
    render(<App />);
    expect(screen.getByTestId('mock-dashboard')).toBeInTheDocument();
  });

  it('renders debug panel in development mode', () => {
    render(<App />);
    expect(screen.getByTestId('mock-debug-panel')).toBeInTheDocument();
  });

  it('does not render debug panel in production mode', () => {
    process.env.NODE_ENV = 'production';
    render(<App />);
    expect(screen.queryByTestId('mock-debug-panel')).not.toBeInTheDocument();
  });

  it('maintains theme provider context', () => {
    render(<App />);
    const mainContainer = screen.getByRole('main');
    const styles = window.getComputedStyle(mainContainer);
    expect(styles.marginTop).toBeDefined();
    expect(styles.marginBottom).toBeDefined();
  });

  it('handles theme toggle action in debug panel', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    render(<App />);
    const themeToggleButton = screen.getByTestId('debug-action-toggle-theme');
    fireEvent.click(themeToggleButton);
    expect(consoleSpy).toHaveBeenCalledWith('Theme toggle clicked');
  });

  it('handles cache clear action in debug panel', () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, 'clear');
    render(<App />);
    const clearCacheButton = screen.getByTestId('debug-action-clear-cache');
    fireEvent.click(clearCacheButton);
    expect(localStorageSpy).toHaveBeenCalled();
  });

  it('handles app reload action in debug panel', () => {
    render(<App />);
    const reloadButton = screen.getByTestId('debug-action-reload-app');
    fireEvent.click(reloadButton);
    expect(window.location.reload).toHaveBeenCalled();
  });
}); 