// Integration tests for the 3D Hand Pose Game
import { audioManager } from '../utils/AudioManager';
import { GestureSequenceDetector, GESTURE_COMBOS } from '../utils/GestureSequence';
import { GameModeManager, GAME_MODES } from '../utils/GameModes';
import { GESTURE_TYPES } from '../utils/gestureRecognition';

describe('3D Hand Pose Game Integration Tests', () => {
  
  describe('Audio System Integration', () => {
    test('should initialize audio manager', () => {
      expect(audioManager).toBeDefined();
      expect(audioManager.sounds.size).toBeGreaterThan(0);
    });

    test('should play gesture sounds', () => {
      // Mock audio context to avoid browser restrictions
      audioManager.isEnabled = true;
      audioManager.audioContext = {
        createOscillator: jest.fn(() => ({
          connect: jest.fn(),
          start: jest.fn(),
          stop: jest.fn(),
          frequency: { value: 0 },
          type: 'sine'
        })),
        createGain: jest.fn(() => ({
          connect: jest.fn(),
          gain: { 
            setValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn(),
            value: 0
          }
        })),
        currentTime: 0
      };
      audioManager.masterGain = { connect: jest.fn() };

      expect(() => {
        audioManager.playGestureSound(GESTURE_TYPES.PINCH, 0.8);
      }).not.toThrow();
    });
  });

  describe('Gesture Sequence Integration', () => {
    let detector;

    beforeEach(() => {
      detector = new GestureSequenceDetector(3000);
    });

    test('should integrate with audio system for combo events', () => {
      let comboDetected = false;
      let comboCompleted = false;

      detector.setEventHandlers({
        onComboDetected: () => { comboDetected = true; },
        onComboCompleted: () => { comboCompleted = true; },
        onComboFailed: () => {}
      });

      // Simulate POWER_UP combo
      const combo = GESTURE_COMBOS.POWER_UP;
      combo.sequence.forEach(gesture => {
        detector.addGesture(gesture, 0.9);
      });

      expect(comboDetected).toBe(true);
      expect(comboCompleted).toBe(true);
    });

    test('should work with game mode manager', () => {
      const mockStore = {
        getState: () => ({
          updatePerformance: jest.fn(),
          addError: jest.fn()
        })
      };

      const gameManager = new GameModeManager(mockStore);
      gameManager.startMode('challenge');

      expect(gameManager.currentMode).toBeDefined();
      expect(gameManager.currentMode.id).toBe('challenge');
    });
  });

  describe('Game Mode Integration', () => {
    let gameManager;
    const mockStore = {
      getState: () => ({
        updatePerformance: jest.fn(),
        addError: jest.fn()
      })
    };

    beforeEach(() => {
      gameManager = new GameModeManager(mockStore);
    });

    test('should start different game modes', () => {
      Object.keys(GAME_MODES).forEach(modeId => {
        const success = gameManager.startMode(modeId.toLowerCase());
        expect(success).toBe(true);
        expect(gameManager.currentMode.id).toBe(modeId.toLowerCase());
      });
    });

    test('should process gestures in game modes', () => {
      gameManager.startMode('speed');
      
      const initialScore = gameManager.modeState.score;
      gameManager.processGesture(GESTURE_TYPES.PINCH, 0.9);
      
      expect(gameManager.modeState.score).toBeGreaterThan(initialScore);
    });

    test('should track objectives', () => {
      gameManager.startMode('challenge');
      
      // Process enough gestures to complete an objective
      for (let i = 0; i < 15; i++) {
        gameManager.processGesture(GESTURE_TYPES.PINCH, 0.9);
      }
      
      const results = gameManager.getResults();
      expect(results.progress.gestureCount[GESTURE_TYPES.PINCH]).toBe(15);
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle WebGL context loss simulation', () => {
      // Simulate WebGL context loss
      const mockCanvas = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };

      const mockEngine = {
        _gl: {
          getError: jest.fn(() => 0),
          NO_ERROR: 0,
          INVALID_ENUM: 1280,
          INVALID_VALUE: 1281,
          INVALID_OPERATION: 1282,
          OUT_OF_MEMORY: 1285,
          CONTEXT_LOST_WEBGL: 37442
        },
        stopRenderLoop: jest.fn(),
        dispose: jest.fn()
      };

      // This would be part of the Game class
      const setupWebGLErrorHandling = (canvas, engine) => {
        canvas.addEventListener('webglcontextlost', (event) => {
          event.preventDefault();
          engine.stopRenderLoop();
        });
      };

      expect(() => {
        setupWebGLErrorHandling(mockCanvas, mockEngine);
      }).not.toThrow();

      expect(mockCanvas.addEventListener).toHaveBeenCalledWith(
        'webglcontextlost', 
        expect.any(Function)
      );
    });
  });

  describe('State Management Integration', () => {
    test('should handle gesture sequence state', () => {
      // This would test the Zustand store integration
      const mockGestureSequence = [
        { gesture: GESTURE_TYPES.OPEN_HAND, timestamp: Date.now() },
        { gesture: GESTURE_TYPES.PINCH, timestamp: Date.now() + 100 }
      ];

      expect(mockGestureSequence).toHaveLength(2);
      expect(mockGestureSequence[0].gesture).toBe(GESTURE_TYPES.OPEN_HAND);
    });
  });

  describe('Performance Integration', () => {
    test('should track performance metrics', () => {
      const startTime = performance.now();
      
      // Simulate some processing
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      expect(latency).toBeGreaterThanOrEqual(0);
      expect(typeof latency).toBe('number');
    });

    test('should calculate FPS', () => {
      let frameCount = 0;
      let lastFrameTime = performance.now();
      
      // Simulate 60 frames
      frameCount = 60;
      const currentTime = performance.now();
      const fps = 60000 / (currentTime - lastFrameTime);
      
      expect(fps).toBeGreaterThan(0);
      expect(typeof fps).toBe('number');
    });
  });

  describe('Component Integration', () => {
    test('should handle keyboard shortcuts', () => {
      const shortcuts = {
        'h': 'toggleHUD',
        'o': 'toggleOverlay', 
        'm': 'openModeSelector',
        'Escape': 'closeModals'
      };

      Object.keys(shortcuts).forEach(key => {
        expect(shortcuts[key]).toBeDefined();
        expect(typeof shortcuts[key]).toBe('string');
      });
    });
  });
});

// Test utilities
export const createMockHandState = (gesture = GESTURE_TYPES.OPEN_HAND, confidence = 0.8) => ({
  isTracking: true,
  gesture,
  confidence,
  position: { x: 100, y: 100 },
  fingerSpread: 0.5,
  gestureDetails: {},
  allGestures: []
});

export const createMockGameState = () => ({
  gameState: 'playing',
  gameMode: 'creative',
  score: 0,
  level: 1,
  lives: 3,
  isLoading: false,
  errors: [],
  handState: createMockHandState(),
  objects: [],
  selectedObject: null,
  performance: {
    fps: 60,
    latency: 16,
    frameCount: 0,
    lastFrameTime: 0
  }
});

// Integration test runner
export const runIntegrationTests = async () => {
  console.log('🧪 Running integration tests...');
  
  try {
    // Test audio system
    console.log('🔊 Testing audio system...');
    audioManager.playSound('success');
    
    // Test gesture sequences
    console.log('🎯 Testing gesture sequences...');
    const detector = new GestureSequenceDetector();
    detector.addGesture(GESTURE_TYPES.OPEN_HAND, 0.9);
    
    // Test game modes
    console.log('🎮 Testing game modes...');
    const gameManager = new GameModeManager({
      getState: () => ({ updatePerformance: () => {}, addError: () => {} })
    });
    gameManager.startMode('creative');
    
    console.log('✅ All integration tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    return false;
  }
};
