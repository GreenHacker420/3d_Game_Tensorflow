import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GESTURE_TYPES } from '../utils/gestureRecognition';

// Game State Management using Zustand with enhanced features
const useGameStore = create(
  subscribeWithSelector((set, get) => ({
    // Game State
    gameState: 'menu', // 'menu', 'playing', 'paused', 'gameOver', 'settings'
    gameMode: 'creative', // 'creative', 'challenge', 'speed', 'memory'
    score: 0,
    level: 1,
    lives: 3,
    isLoading: false,
    errors: [],
  
  // Hand Detection State (Enhanced)
  handState: {
    isTracking: false,
    isPinched: false,
    position: { x: 0, y: 0 },
    fingerSpread: 0,
    confidence: 0,
    gesture: GESTURE_TYPES.NO_HAND,
    gestureDetails: {},
    allGestures: [],
    leftHand: null,  // For two-hand support
    rightHand: null, // For two-hand support
    gestureHistory: [], // For sequence detection
    lastGestureTime: 0
  },

  // Multi-Object State
  objects: [],
  selectedObject: null,
  gestureCompatibility: [],
  
  // UI State
  showHUD: true,
  showInstructions: true,
  showSettings: false,
  showPauseMenu: false,
  hudMinimized: false,
  overlayMinimized: false,
  
  // Game Settings
  settings: {
    volume: 0.7,
    handSensitivity: 1.0,
    showFPS: false,
    quality: 'high', // 'low', 'medium', 'high'
    theme: 'dark', // 'dark', 'light'
    enablePhysics: true,
    enableAudio: true,
    enableTwoHands: false,
    gestureSequenceTimeout: 3000 // ms
  },

  // 3D Motion Mode State
  motionMode: {
    currentMode: '2d_tracking', // '2d_tracking' or '3d_motion'
    isCalibrated: false,
    calibrationData: null,
    qualityScore: 1.0,
    showCalibrationModal: false,
    show3DTrackingHUD: true,
    trackingHUDMinimized: false
  },
  
  // Performance Metrics
  performance: {
    fps: 0,
    handDetectionLatency: 0,
    renderTime: 0,
    frameCount: 0,
    lastFrameTime: 0
  },

  // Gesture Sequences & Combos
  gestureSequences: [],
  activeCombo: null,
  comboMultiplier: 1,

  // Audio State
  audioEnabled: true,
  currentMusic: null,
  soundEffects: new Map(),
  
  // Actions
  setGameState: (state) => set({ gameState: state }),
  setGameMode: (mode) => set({ gameMode: mode }),

  // Error handling
  addError: (error) => set((state) => ({
    errors: [...state.errors, { id: Date.now(), message: error, timestamp: new Date() }]
  })),
  removeError: (id) => set((state) => ({
    errors: state.errors.filter(error => error.id !== id)
  })),
  clearErrors: () => set({ errors: [] }),
  
  setScore: (score) => set({ score }),
  addScore: (points) => set((state) => ({ score: state.score + points })),
  
  setLevel: (level) => set({ level }),
  nextLevel: () => set((state) => ({ level: state.level + 1 })),
  
  setLives: (lives) => set({ lives }),
  loseLife: () => set((state) => ({ lives: Math.max(0, state.lives - 1) })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  updateHandState: (handState) => set({ handState }),

  // Multi-object actions
  updateObjects: (objects) => set({ objects }),
  setSelectedObject: (selectedObject) => set({ selectedObject }),
  updateGestureCompatibility: (gestureCompatibility) => set({ gestureCompatibility }),
  
  toggleHUD: () => set((state) => ({ showHUD: !state.showHUD })),
  toggleInstructions: () => set((state) => ({ showInstructions: !state.showInstructions })),
  toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
  togglePauseMenu: () => set((state) => ({ showPauseMenu: !state.showPauseMenu })),
  setHudMinimized: (minimized) => set({ hudMinimized: minimized }),
  setOverlayMinimized: (minimized) => set({ overlayMinimized: minimized }),
  
  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),
  
  updatePerformance: (metrics) => set((state) => ({
    performance: { ...state.performance, ...metrics }
  })),

  // 3D Motion Mode Actions
  setTrackingMode: (mode) => set((state) => ({
    motionMode: { ...state.motionMode, currentMode: mode }
  })),

  setCalibrationStatus: (isCalibrated, calibrationData = null) => set((state) => ({
    motionMode: {
      ...state.motionMode,
      isCalibrated,
      calibrationData: calibrationData || state.motionMode.calibrationData
    }
  })),

  updateMotionModeQuality: (qualityScore) => set((state) => ({
    motionMode: { ...state.motionMode, qualityScore }
  })),

  toggleCalibrationModal: () => set((state) => ({
    motionMode: { ...state.motionMode, showCalibrationModal: !state.motionMode.showCalibrationModal }
  })),

  setCalibrationModal: (show) => set((state) => ({
    motionMode: { ...state.motionMode, showCalibrationModal: show }
  })),

  toggle3DTrackingHUD: () => set((state) => ({
    motionMode: { ...state.motionMode, show3DTrackingHUD: !state.motionMode.show3DTrackingHUD }
  })),

  set3DTrackingHUDMinimized: (minimized) => set((state) => ({
    motionMode: { ...state.motionMode, trackingHUDMinimized: minimized }
  })),
  
  // Game Actions
  startGame: () => set({
    gameState: 'playing',
    score: 0,
    level: 1,
    lives: 3,
    showPauseMenu: false
  }),
  
  pauseGame: () => set({
    gameState: 'paused',
    showPauseMenu: true
  }),
  
  resumeGame: () => set({
    gameState: 'playing',
    showPauseMenu: false
  }),
  
  gameOver: () => set({
    gameState: 'gameOver',
    showPauseMenu: false
  }),
  
  resetGame: () => set({
    gameState: 'menu',
    score: 0,
    level: 1,
    lives: 3,
    showPauseMenu: false,
    showSettings: false,
    gestureSequences: [],
    activeCombo: null,
    comboMultiplier: 1
  }),

  // Gesture sequence actions
  addGestureToSequence: (gesture) => set((state) => {
    const newSequence = [...state.gestureSequences, {
      gesture,
      timestamp: Date.now()
    }];

    // Remove old gestures beyond timeout
    const timeout = state.settings.gestureSequenceTimeout;
    const cutoffTime = Date.now() - timeout;
    const filteredSequence = newSequence.filter(g => g.timestamp > cutoffTime);

    return { gestureSequences: filteredSequence };
  }),

  clearGestureSequence: () => set({ gestureSequences: [] }),

  setActiveCombo: (combo) => set({ activeCombo: combo }),
  setComboMultiplier: (multiplier) => set({ comboMultiplier: multiplier }),

  // Audio actions
  setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),
  setCurrentMusic: (music) => set({ currentMusic: music }),
  addSoundEffect: (name, audio) => set((state) => {
    const newSoundEffects = new Map(state.soundEffects);
    newSoundEffects.set(name, audio);
    return { soundEffects: newSoundEffects };
  })
  }))
);

export default useGameStore;
