import React from 'react';
import { Card, CardTitle } from './ui/Card.jsx';
import { BackgroundBeams } from './ui/BackgroundBeams.jsx';
import { ReloadIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown'
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Categorize error types for better user feedback
    let errorType = 'unknown';
    if (error.message?.includes('WebGL') || error.message?.includes('uniformMatrix4fv')) {
      errorType = 'webgl';
    } else if (error.message?.includes('TensorFlow') || error.message?.includes('handpose')) {
      errorType = 'tensorflow';
    } else if (error.message?.includes('Babylon') || error.message?.includes('scene')) {
      errorType = 'babylon';
    } else if (error.message?.includes('webcam') || error.message?.includes('camera')) {
      errorType = 'camera';
    }

    this.setState({
      error: error,
      errorInfo: errorInfo,
      errorType: errorType
    });

    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Send error to analytics if available
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: true
      });
    }
  }

  getErrorMessage() {
    const { errorType } = this.state;
    const messages = {
      webgl: {
        title: '🎮 Graphics Error',
        description: 'There was an issue with 3D graphics rendering. This might be due to outdated graphics drivers or browser compatibility.',
        suggestions: ['Update your graphics drivers', 'Try a different browser (Chrome/Firefox)', 'Enable hardware acceleration in browser settings']
      },
      tensorflow: {
        title: '🤖 AI Model Error',
        description: 'The hand tracking AI model failed to load or process data.',
        suggestions: ['Check your internet connection', 'Ensure webcam permissions are granted', 'Try refreshing the page']
      },
      babylon: {
        title: '🌐 3D Scene Error',
        description: 'The 3D scene failed to initialize or render properly.',
        suggestions: ['Check WebGL support in your browser', 'Close other tabs to free up memory', 'Try lowering graphics quality']
      },
      camera: {
        title: '📹 Camera Error',
        description: 'Unable to access or process webcam feed.',
        suggestions: ['Grant camera permissions', 'Check if camera is being used by another app', 'Try refreshing the page']
      },
      unknown: {
        title: '🚨 Unexpected Error',
        description: 'The 3D Hand Pose Game encountered an unexpected error.',
        suggestions: ['Try refreshing the page', 'Clear browser cache', 'Check browser console for details']
      }
    };
    return messages[errorType] || messages.unknown;
  }

  render() {
    if (this.state.hasError) {
      const errorInfo = this.getErrorMessage();

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 font-sans text-white">
          <BackgroundBeams className="absolute top-0 left-0 w-full h-full z-0" />

          <div className="relative z-10 w-full max-w-lg px-4">
            <Card className="border-red-500/30 bg-black/80 backdrop-blur-xl">
              <div className="flex flex-col items-center text-center p-6 space-y-6">
                <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
                  <ExclamationTriangleIcon className="w-12 h-12" />
                </div>

                <div>
                  <CardTitle className="text-2xl text-red-400 mb-2 mt-0">{errorInfo.title}</CardTitle>
                  <p className="text-gray-300">{errorInfo.description}</p>
                </div>

                {/* Suggestions */}
                <div className="w-full text-left bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                    💡 Try these solutions:
                  </h3>
                  <ul className="space-y-2">
                    {errorInfo.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="mt-1 w-1 h-1 rounded-full bg-gray-500"></span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <ReloadIcon /> Reload Game
                  </button>
                  <button
                    onClick={() => this.setState({ hasError: false, error: null, errorInfo: null, errorType: 'unknown' })}
                    className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-lg font-medium transition-colors"
                  >
                    Try Again
                  </button>
                </div>

                {/* Dev Details */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="w-full text-left pt-4 border-t border-white/10">
                    <summary className="cursor-pointer text-xs text-orange-400 font-mono hover:text-orange-300">
                      View Technical Details
                    </summary>
                    <div className="mt-2 text-xs font-mono bg-black/50 p-3 rounded border border-white/5 overflow-auto max-h-40">
                      {this.state.error && this.state.error.toString()}
                      <br />
                      {this.state.errorInfo?.componentStack}
                    </div>
                  </details>
                )}
              </div>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
