import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h1>🚨 Something went wrong</h1>
            <p>The 3D Hand Pose Game encountered an unexpected error.</p>
            
            <div className="error-actions">
              <button 
                onClick={() => window.location.reload()}
                className="error-btn primary"
              >
                🔄 Reload Game
              </button>
              
              <button 
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="error-btn secondary"
              >
                🔧 Try Again
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>🐛 Error Details (Development Mode)</summary>
                <div className="error-stack">
                  <h3>Error:</h3>
                  <pre>{this.state.error && this.state.error.toString()}</pre>
                  
                  <h3>Component Stack:</h3>
                  <pre>{this.state.errorInfo?.componentStack || 'No component stack available'}</pre>
                </div>
              </details>
            )}
          </div>
          
          <style jsx>{`
            .error-boundary {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 9999;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            }
            
            .error-content {
              text-align: center;
              max-width: 600px;
              padding: 40px;
              background: rgba(0, 0, 0, 0.8);
              border-radius: 16px;
              border: 2px solid #ff4444;
              backdrop-filter: blur(10px);
            }
            
            .error-content h1 {
              font-size: 2.5em;
              margin: 0 0 20px 0;
              color: #ff4444;
            }
            
            .error-content p {
              font-size: 1.2em;
              margin: 0 0 30px 0;
              opacity: 0.9;
              line-height: 1.5;
            }
            
            .error-actions {
              display: flex;
              gap: 16px;
              justify-content: center;
              margin-bottom: 30px;
            }
            
            .error-btn {
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              font-size: 1em;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .error-btn.primary {
              background: #4CAF50;
              color: white;
            }
            
            .error-btn.primary:hover {
              background: #45a049;
              transform: translateY(-2px);
            }
            
            .error-btn.secondary {
              background: rgba(255, 255, 255, 0.1);
              color: white;
              border: 1px solid rgba(255, 255, 255, 0.3);
            }
            
            .error-btn.secondary:hover {
              background: rgba(255, 255, 255, 0.2);
              transform: translateY(-2px);
            }
            
            .error-details {
              text-align: left;
              margin-top: 20px;
              background: rgba(0, 0, 0, 0.5);
              border-radius: 8px;
              padding: 16px;
            }
            
            .error-details summary {
              cursor: pointer;
              font-weight: 600;
              color: #ffaa00;
              margin-bottom: 12px;
            }
            
            .error-stack {
              font-size: 0.85em;
            }
            
            .error-stack h3 {
              color: #ff4444;
              margin: 16px 0 8px 0;
              font-size: 1em;
            }
            
            .error-stack pre {
              background: rgba(0, 0, 0, 0.7);
              padding: 12px;
              border-radius: 4px;
              overflow-x: auto;
              white-space: pre-wrap;
              word-wrap: break-word;
              font-family: 'Courier New', monospace;
              font-size: 0.8em;
              line-height: 1.4;
              border-left: 3px solid #ff4444;
            }
            
            @media (max-width: 768px) {
              .error-content {
                margin: 20px;
                padding: 30px 20px;
              }
              
              .error-content h1 {
                font-size: 2em;
              }
              
              .error-content p {
                font-size: 1em;
              }
              
              .error-actions {
                flex-direction: column;
                align-items: center;
              }
              
              .error-btn {
                width: 100%;
                max-width: 200px;
              }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
