import React from 'react';
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
    startDetection: jest.fn()
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

// Mock react-webcam
jest.mock('react-webcam', () => {
  return React.forwardRef((props, ref) => (
    <div data-testid="webcam-mock" ref={ref}>
      Webcam Mock
    </div>
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
    const app = document.querySelector('.app');
    expect(app).toBeInTheDocument();
    
    const mainContent = document.querySelector('.main-content');
    expect(mainContent).toBeInTheDocument();
  });
});
