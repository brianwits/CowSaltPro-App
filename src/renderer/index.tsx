import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Performance monitoring
const startTime = performance.now();

// Setup error boundary for the entire application
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Renderer Error:', error, errorInfo);
    
    // Log to main process if API is available
    if (window.api?.send) {
      window.api.send('log-message', {
        level: 'error',
        message: `Renderer Error: ${error.message}`,
        stack: error.stack,
        info: errorInfo
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          margin: '20px', 
          backgroundColor: '#ffebee',
          border: '1px solid #ef5350',
          borderRadius: '4px',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h2 style={{ color: '#b71c1c' }}>Something went wrong</h2>
          <p>The application encountered an error. Please try refreshing the page.</p>
          {this.state.error && (
            <details style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
              <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
                {this.state.error.toString()}
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Function to initialize the application
function initializeApp() {
  // Create a loading indicator
  const loadingElement = document.createElement('div');
  loadingElement.id = 'app-loading';
  loadingElement.innerHTML = `
    <style>
      #app-loading {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: #f5f5f5;
        z-index: 9999;
        font-family: 'Roboto', sans-serif;
        transition: opacity 0.5s ease-out;
      }
      #app-loading.fade-out {
        opacity: 0;
      }
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-left-color: #2196f3;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      .loading-text {
        margin-top: 20px;
        font-size: 16px;
        color: #333;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
    <div class="spinner"></div>
    <div class="loading-text">Loading CowSalt Pro...</div>
  `;
  document.body.appendChild(loadingElement);
  
  try {
    // Locate root element
const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find the root element');
}

    // Create React root and render app
const root = createRoot(container);
root.render(
      <ErrorBoundary>
  <React.StrictMode>
    <App />
  </React.StrictMode>
      </ErrorBoundary>
    );
    
    // Remove loading indicator after rendering completes
    setTimeout(() => {
      const loading = document.getElementById('app-loading');
      if (loading) {
        loading.classList.add('fade-out');
        setTimeout(() => {
          if (loading.parentNode) {
            loading.parentNode.removeChild(loading);
          }
        }, 500);
      }
    }, 1000);
    
    // Log performance metrics
    const endTime = performance.now();
    console.log(`App rendered in ${(endTime - startTime).toFixed(2)}ms`);
    
    // Notify main process that app is ready
    if (window.api?.send) {
      window.api.send('app-ready', { 
        renderTime: endTime - startTime,
        success: true
      });
    }
  } catch (error) {
    console.error('Failed to initialize app:', error);
    
    // Show error in loading element
    if (loadingElement) {
      // Cast error to any to safely access message property
      const errorObj = error as any;
      const errorMessage = errorObj && errorObj.message 
        ? errorObj.message 
        : 'Unknown initialization error';
        
      loadingElement.innerHTML = `
        <style>
          #app-loading {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background-color: #ffebee;
            z-index: 9999;
            font-family: 'Roboto', sans-serif;
            padding: 20px;
            text-align: center;
          }
          .error-icon {
            font-size: 48px;
            color: #d32f2f;
            margin-bottom: 20px;
          }
          .error-title {
            font-size: 24px;
            color: #d32f2f;
            margin-bottom: 10px;
          }
          .error-message {
            font-size: 16px;
            color: #333;
            margin-bottom: 20px;
          }
          .reload-button {
            padding: 10px 20px;
            background-color: #2196f3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          }
        </style>
        <div class="error-icon">❌</div>
        <div class="error-title">Application Error</div>
        <div class="error-message">
          Failed to initialize the application. This could be due to a configuration issue.
          <br><br>
          ${errorMessage}
        </div>
        <button class="reload-button" onclick="window.location.reload()">
          Reload Application
        </button>
      `;
    }
    
    // Notify main process of error
    if (window.api?.send) {
      window.api.send('app-ready', { 
        success: false,
        error: String(error)
      });
    }
  }
}

// Define the API interface to fix TypeScript errors
declare global {
  interface Window {
    api?: {
      send: (channel: string, data: any) => void;
      on: (channel: string, callback: (...args: any[]) => void) => void;
      invoke: <T>(channel: string, data?: any) => Promise<T>;
      platform?: string;
      isDev?: boolean;
    };
  }
}

// Add a small delay to ensure DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeApp, 50);
  });
} else {
  setTimeout(initializeApp, 50);
}