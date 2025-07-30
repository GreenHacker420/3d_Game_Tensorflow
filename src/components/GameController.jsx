import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore.js';
import { GAME_MODES } from '../utils/GameModes.js';

/**
 * Game Controller component that manages game state transitions and loop
 */
const GameController = ({
  handState,
  objectsInfo = [],
  selectedObject = null,
  onGameStateChange,
  className = ''
}) => {
  const {
    gameState,
    gameMode,
    score,
    level,
    lives,
    startGame,
    pauseGame,
    resumeGame,
    gameOver,
    resetGame,
    setGameMode,
    addScore,
    nextLevel,
    loseLife
  } = useGameStore();

  /**
   * Handle game state transitions based on conditions
   */
  const checkGameConditions = useCallback(() => {
    if (gameState !== 'playing') return;

    // Check for game over conditions
    if (lives <= 0) {
      gameOver();
      return;
    }

    // Check for level completion (example: score thresholds)
    const currentMode = GAME_MODES[gameMode.toUpperCase()];
    if (currentMode && currentMode.features.scoring) {
      const levelThreshold = level * 1000; // 1000 points per level
      if (score >= levelThreshold) {
        nextLevel();
        addScore(100); // Bonus for level completion
      }
    }
  }, [gameState, lives, score, level, gameMode, gameOver, nextLevel, addScore]);

  /**
   * Process gesture interactions for scoring
   */
  const processGestureInteraction = useCallback((gesture, confidence) => {
    if (gameState !== 'playing') return;

    const currentMode = GAME_MODES[gameMode.toUpperCase()];
    if (!currentMode || !currentMode.features.scoring) return;

    // Award points based on gesture accuracy and confidence
    const basePoints = 10;
    const confidenceMultiplier = Math.max(0.5, confidence);
    const points = Math.round(basePoints * confidenceMultiplier);

    addScore(points);
  }, [gameState, gameMode, addScore]);

  /**
   * Handle game mode selection
   */
  const handleGameModeSelect = useCallback((mode) => {
    setGameMode(mode);
    if (onGameStateChange) {
      onGameStateChange('modeSelected', mode);
    }
  }, [setGameMode, onGameStateChange]);

  /**
   * Handle game start
   */
  const handleStartGame = useCallback(() => {
    startGame();
    if (onGameStateChange) {
      onGameStateChange('gameStarted', gameMode);
    }
  }, [startGame, gameMode, onGameStateChange]);

  /**
   * Handle game pause/resume
   */
  const handlePauseToggle = useCallback(() => {
    if (gameState === 'playing') {
      pauseGame();
    } else if (gameState === 'paused') {
      resumeGame();
    }
  }, [gameState, pauseGame, resumeGame]);

  /**
   * Handle game reset
   */
  const handleResetGame = useCallback(() => {
    resetGame();
    if (onGameStateChange) {
      onGameStateChange('gameReset');
    }
  }, [resetGame, onGameStateChange]);

  // Monitor game conditions
  useEffect(() => {
    checkGameConditions();
  }, [checkGameConditions]);

  // Process hand gestures for scoring
  useEffect(() => {
    if (handState.isTracking && handState.gesture !== 'no_hand') {
      processGestureInteraction(handState.gesture, handState.confidence);
    }
  }, [handState.gesture, handState.confidence, handState.isTracking, processGestureInteraction]);

  // Render game state UI
  const renderGameStateUI = () => {
    switch (gameState) {
      case 'menu':
        return (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-md w-full mx-4">
              <h1 className="text-3xl font-bold text-center text-green-400 mb-6">
                🎮 3D Hand Pose Game
              </h1>
              
              <div className="space-y-4 mb-6">
                <h2 className="text-lg font-semibold text-white">Select Game Mode:</h2>
                {Object.entries(GAME_MODES).map(([key, mode]) => (
                  <button
                    key={key}
                    onClick={() => handleGameModeSelect(key.toLowerCase())}
                    className={`w-full p-3 rounded border transition-colors ${
                      gameMode === key.toLowerCase()
                        ? 'border-green-400 bg-green-900/20 text-green-400'
                        : 'border-gray-600 bg-gray-800 text-white hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{mode.icon}</span>
                      <div className="text-left">
                        <div className="font-medium">{mode.name}</div>
                        <div className="text-sm text-gray-400">{mode.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleStartGame}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition-colors"
              >
                🚀 Start Game
              </button>
            </div>
          </motion.div>
        );

      case 'paused':
        return (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-sm w-full mx-4">
              <h2 className="text-2xl font-bold text-center text-yellow-400 mb-4">
                ⏸️ Game Paused
              </h2>
              <div className="space-y-3">
                <button
                  onClick={handlePauseToggle}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                >
                  ▶️ Resume
                </button>
                <button
                  onClick={handleResetGame}
                  className="w-full py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                >
                  🔄 Restart
                </button>
              </div>
            </div>
          </motion.div>
        );

      case 'gameOver':
        return (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-gray-900 border border-red-700 rounded-lg p-6 max-w-sm w-full mx-4">
              <h2 className="text-2xl font-bold text-center text-red-400 mb-4">
                💀 Game Over
              </h2>
              <div className="text-center mb-4">
                <div className="text-lg text-white">Final Score: {score}</div>
                <div className="text-sm text-gray-400">Level: {level}</div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleResetGame}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                >
                  🔄 Play Again
                </button>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={className}>
      <AnimatePresence>
        {renderGameStateUI()}
      </AnimatePresence>

      {/* Game HUD for playing state */}
      {gameState === 'playing' && (
        <motion.div
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-30"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-2">
            <div className="flex items-center gap-6 text-sm">
              <div className="text-green-400">
                🎯 Score: <span className="font-bold">{score}</span>
              </div>
              <div className="text-blue-400">
                📊 Level: <span className="font-bold">{level}</span>
              </div>
              <div className="text-red-400">
                ❤️ Lives: <span className="font-bold">{lives}</span>
              </div>
              <div className="text-yellow-400">
                🎮 {GAME_MODES[gameMode.toUpperCase()]?.name || gameMode}
              </div>
              <button
                onClick={handlePauseToggle}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ⏸️
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GameController;
