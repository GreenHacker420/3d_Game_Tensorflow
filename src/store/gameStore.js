import { create } from 'zustand';

// Game State Management using Zustand
const useGameStore = create((set, get) => ({
  // Game State
  gameState: 'menu', // 'menu', 'playing', 'paused', 'gameOver', 'settings'
  score: 0,
  level: 1,
  lives: 3,
  isLoading: false,
  
  // Hand Detection State
  handState: {
    isTracking: false,
    isPinched: false,
    position: { x: 0, y: 0 },
    fingerSpread: 0,
    confidence: 0,
    gesture: 'no_hand',
    gestureDetails: {},
    allGestures: []
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
  
  // Game Settings
  settings: {
    volume: 0.7,
    handSensitivity: 1.0,
    showFPS: false,
    quality: 'high', // 'low', 'medium', 'high'
    theme: 'dark' // 'dark', 'light'
  },
  
  // Performance Metrics
  performance: {
    fps: 0,
    handDetectionLatency: 0,
    renderTime: 0
  },
  
  // Actions
  setGameState: (state) => set({ gameState: state }),
  
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
  
  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),
  
  updatePerformance: (metrics) => set((state) => ({
    performance: { ...state.performance, ...metrics }
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
    showSettings: false
  })
}));

export default useGameStore;
