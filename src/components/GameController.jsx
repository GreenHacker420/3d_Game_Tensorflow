import React, { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore.js';
import { GAME_MODES } from '../utils/GameModes.js';
import { BackgroundBeams } from './ui/BackgroundBeams';
import { HoverBorderGradient } from './ui/HoverBorderGradient';
import {
  PlayIcon,
  PauseIcon,
  ReloadIcon,
  CrossCircledIcon,
  MixerHorizontalIcon, // For Creative
  TargetIcon,         // For Challenge
  LightningBoltIcon,  // For Speed
  ContainerIcon       // For Memory (using Container as abstract representation)
} from '@radix-ui/react-icons';

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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950">
            <BackgroundBeams className="absolute top-0 left-0 w-full h-full z-0" />
            <motion.div
              className="relative z-10 w-full max-w-2xl px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 font-sans tracking-tight mb-4">
                  Hand Pose Odyssey
                </h1>
                <p className="text-neutral-500 max-w-lg mx-auto text-lg">
                  Control the digital realm with your hands. Use gestures to interact, create, and conquer challenges in 3D space.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {Object.entries(GAME_MODES).map(([key, mode]) => (
                  <button
                    key={key}
                    onClick={() => handleGameModeSelect(key.toLowerCase())}
                    className={`relative group p-6 rounded-xl border transition-all duration-300 text-left hover:scale-[1.02] ${gameMode === key.toLowerCase()
                      ? 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]'
                      : 'border-white/10 bg-black/40 hover:bg-white/5 hover:border-white/20'
                      }`}
                  >
                    <div className={`p-3 rounded-lg w-fit mb-4 ${gameMode === key.toLowerCase() ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-neutral-400 group-hover:text-white group-hover:bg-white/10'
                      }`}>
                      {/* Dynamic Icon Rendering based on mode name/key */}
                      {key === 'CREATIVE' && <MixerHorizontalIcon className="w-6 h-6" />}
                      {key === 'CHALLENGE' && <TargetIcon className="w-6 h-6" />}
                      {key === 'SPEED' && <LightningBoltIcon className="w-6 h-6" />}
                      {key === 'MEMORY' && <ContainerIcon className="w-6 h-6" />}
                    </div>
                    <h3 className={`font-semibold text-lg mb-1 ${gameMode === key.toLowerCase() ? 'text-white' : 'text-neutral-200'
                      }`}>
                      {mode.name}
                    </h3>
                    <p className="text-sm text-neutral-400 group-hover:text-neutral-300">
                      {mode.description}
                    </p>
                  </button>
                ))}
              </div>

              <div className="flex justify-center">
                <HoverBorderGradient
                  containerClassName="rounded-full"
                  as="button"
                  className="bg-black text-white flex items-center space-x-2 px-8 py-3"
                  onClick={handleStartGame}
                >
                  <PlayIcon className="w-5 h-5" />
                  <span className="text-lg font-medium">Start Experience</span>
                </HoverBorderGradient>
              </div>
            </motion.div>
          </div>
        );

      case 'paused':
        return (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-6">
                  <PauseIcon className="w-8 h-8 text-yellow-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Paused</h2>
                <p className="text-neutral-400 mb-8">Take a breather. Ready to continue?</p>

                <div className="w-full space-y-3">
                  <button
                    onClick={handlePauseToggle}
                    className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <PlayIcon className="w-4 h-4" />
                    Resume
                  </button>
                  <button
                    onClick={handleResetGame}
                    className="w-full py-3 bg-white/5 text-white font-medium rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <ReloadIcon className="w-4 h-4" />
                    Restart Level
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'gameOver':
        return (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-neutral-900 border border-red-500/20 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)]">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                  <CrossCircledIcon className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Game Over</h2>
                <div className="flex gap-8 my-6 w-full justify-center border-y border-white/5 py-4">
                  <div className="text-center">
                    <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Score</div>
                    <div className="text-2xl font-bold text-white">{score}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Level</div>
                    <div className="text-2xl font-bold text-white">{level}</div>
                  </div>
                </div>

                <button
                  onClick={handleResetGame}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                >
                  <ReloadIcon className="w-4 h-4" />
                  Try Again
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
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 shadow-lg flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400"><TargetIcon /></span>
              <span className="text-neutral-200 font-mono font-bold text-lg">{score}</span>
            </div>

            <div className="w-px h-4 bg-white/20" />

            <div className="flex items-center gap-2">
              <span className="text-blue-400"><MixerHorizontalIcon /></span>
              <span className="text-neutral-200 font-mono font-bold text-lg">{level}</span>
            </div>

            <div className="w-px h-4 bg-white/20" />

            <div className="flex items-center gap-2">
              <span className="text-red-400"><svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 1.70834C5.10667 -1.27216 0.166667 1.88459 0.166667 5.06251C0.166667 7.79543 3.48042 10.9663 7.5 14.1667C11.5196 10.9663 14.8333 7.79543 14.8333 5.06251C14.8333 1.88459 9.89333 -1.27216 7.5 1.70834Z" fill="currentColor" /></svg></span>
              <span className="text-neutral-200 font-mono font-bold text-lg">{lives}</span>
            </div>

            <div className="w-px h-4 bg-white/20" />

            <div className="flex items-center gap-2 px-2 py-1 rounded bg-white/5 border border-white/10">
              <span className="text-xs font-medium text-neutral-300 uppercase tracking-wider">
                {GAME_MODES[gameMode.toUpperCase()]?.name || gameMode}
              </span>
            </div>

            <button
              onClick={handlePauseToggle}
              className="ml-2 p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <PauseIcon className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GameController;
