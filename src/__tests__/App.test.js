import { render, screen } from '@testing-library/react';
import App from '../App.jsx';

// Mock the hooks to avoid WebGL and camera issues in tests
jest.mock('../hooks/useHandDetection.js', () => ({
  __esModule: true,
  default: () => ({
    isLoading: false,
    error: null,
    handState: {
      isTracking: false,
      gesture: 'no_hand',
      confidence: 0,
      position: { x: 0, y: 0 },
      fingerSpread: 0,
      isPinched: false
    },
    performance: {
      fps: 60,
      latency: 10,
      frameCount: 0
    },
    initialize: jest.fn(),
    startDetection: jest.fn(),
    switchTrackingMode: jest.fn(),
    startCalibration: jest.fn(),
    get3DModeStatus: jest.fn(() => ({
      isAvailable: true,
      isCalibrated: false,
      calibrationProgress: 0
    }))
  })
}));

jest.mock('../hooks/use3DScene.js', () => ({
  __esModule: true,
  default: () => ({
    isLoading: false,
    error: null,
    cubeInfo: {
      name: 'TestCube',
      position: { x: 0, y: 0, z: 0 },
      scale: 1.0,
      isSelected: false,
      isGrabbed: false
    },
    initialize: jest.fn(),
    updateCubeWithHand: jest.fn()
  })
}));

// Mock useLenis hook
jest.mock('../hooks/useLenis.js', () => ({
  __esModule: true,
  default: () => ({
    scrollTo: jest.fn(),
    start: jest.fn(),
    stop: jest.fn()
  })
}));

// Mock react-webcam
jest.mock('react-webcam', () => {
  const mockReact = require('react');
  return mockReact.forwardRef((_props, ref) => (
    mockReact.createElement('div', {
      'data-testid': 'webcam-mock',
      ref: ref
    }, 'Webcam Mock')
  ));
});

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('webcam-mock')).toBeInTheDocument();
  });

  test('displays instructions', () => {
    render(<App />);
    expect(screen.getByText('Open Hand - Move Cube')).toBeInTheDocument();
    expect(screen.getByText('Fist - Grab Cube')).toBeInTheDocument();
    expect(screen.getByText('Pinch - Scale Cube')).toBeInTheDocument();
  });

  test('has main content layout', () => {
    render(<App />);
    // Check for the main container with proper classes
    const mainContainer = document.querySelector('.min-h-screen');
    expect(mainContainer).toBeInTheDocument();

    // Check for the flex layout container
    const flexContainer = document.querySelector('.flex.h-screen');
    expect(flexContainer).toBeInTheDocument();
  });
});
