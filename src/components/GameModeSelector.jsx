import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllModes } from '../utils/GameModes';
import './GameModeSelector.css';

const GameModeSelector = ({ 
  onModeSelect = () => {},
  onClose = () => {},
  currentMode = null,
  isVisible = false 
}) => {
  const [selectedMode, setSelectedMode] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const modes = getAllModes();

  const handleModeClick = (mode) => {
    setSelectedMode(mode);
    setShowDetails(true);
  };

  const handleStartMode = () => {
    if (selectedMode) {
      onModeSelect(selectedMode.id);
      onClose();
    }
  };

  const getModeFeaturesList = (mode) => {
    const features = [];
    if (mode.features.timeLimit) features.push('⏱️ Time Limit');
    if (mode.features.scoring) features.push('🏆 Scoring');
    if (mode.features.objectives) features.push('🎯 Objectives');
    if (mode.features.physicsEnabled) features.push('⚡ Physics');
    if (mode.features.comboSystem) features.push('🔗 Combos');
    return features;
  };

  const getModeSettings = (mode) => {
    const settings = [];
    if (mode.settings.timeLimit) settings.push(`Time: ${mode.settings.timeLimit}s`);
    if (mode.settings.objectSpawnRate) settings.push(`Spawn Rate: ${mode.settings.objectSpawnRate}s`);
    if (mode.settings.speedMultiplier) settings.push(`Speed: ${mode.settings.speedMultiplier}x`);
    if (mode.settings.sequenceLength) settings.push(`Sequence: ${mode.settings.sequenceLength}`);
    return settings;
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="game-mode-selector-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="game-mode-selector"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="selector-header">
          <h2>🎮 Select Game Mode</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modes-container">
          {!showDetails ? (
            <motion.div 
              className="modes-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {modes.map((mode) => (
                <motion.div
                  key={mode.id}
                  className={`mode-card ${currentMode === mode.id ? 'current' : ''}`}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleModeClick(mode)}
                >
                  <div className="mode-icon">{mode.icon}</div>
                  <h3 className="mode-name">{mode.name}</h3>
                  <p className="mode-description">{mode.description}</p>
                  
                  <div className="mode-features">
                    {getModeFeaturesList(mode).slice(0, 3).map((feature, index) => (
                      <span key={index} className="feature-tag">{feature}</span>
                    ))}
                  </div>

                  {currentMode === mode.id && (
                    <div className="current-mode-badge">Currently Playing</div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="mode-details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <button 
                className="back-btn"
                onClick={() => setShowDetails(false)}
              >
                ← Back to Modes
              </button>

              <div className="details-content">
                <div className="details-header">
                  <div className="details-icon">{selectedMode.icon}</div>
                  <div>
                    <h2>{selectedMode.name}</h2>
                    <p className="details-description">{selectedMode.description}</p>
                  </div>
                </div>

                <div className="details-sections">
                  <div className="details-section">
                    <h4>🎯 Features</h4>
                    <div className="features-list">
                      {getModeFeaturesList(selectedMode).map((feature, index) => (
                        <div key={index} className="feature-item">{feature}</div>
                      ))}
                    </div>
                  </div>

                  <div className="details-section">
                    <h4>⚙️ Settings</h4>
                    <div className="settings-list">
                      {getModeSettings(selectedMode).map((setting, index) => (
                        <div key={index} className="setting-item">{setting}</div>
                      ))}
                    </div>
                  </div>

                  {selectedMode.settings.gestureRequirements && selectedMode.settings.gestureRequirements.length > 0 && (
                    <div className="details-section">
                      <h4>✋ Required Gestures</h4>
                      <div className="gestures-list">
                        {selectedMode.settings.gestureRequirements.map((gesture, index) => (
                          <div key={index} className="gesture-item">
                            {getGestureEmoji(gesture)} {gesture.replace('_', ' ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="details-section">
                    <h4>📋 How to Play</h4>
                    <div className="instructions">
                      {getInstructions(selectedMode)}
                    </div>
                  </div>
                </div>

                <div className="details-actions">
                  <button 
                    className="start-mode-btn"
                    onClick={handleStartMode}
                    disabled={currentMode === selectedMode.id}
                  >
                    {currentMode === selectedMode.id ? 'Currently Playing' : `Start ${selectedMode.name}`}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Helper functions
const getGestureEmoji = (gesture) => {
  const gestureEmojis = {
    'open_hand': '✋',
    'closed_fist': '✊',
    'pinch': '🤏',
    'point': '👆',
    'victory': '✌️',
    'thumbs_up': '👍',
    'rock_on': '🤘',
    'ok_sign': '👌'
  };
  return gestureEmojis[gesture] || '❓';
};

const getInstructions = (mode) => {
  const instructions = {
    creative: [
      "• Use any gesture to interact with objects",
      "• Experiment with physics and combos",
      "• No time limits or objectives",
      "• Perfect for learning and exploration"
    ],
    challenge: [
      "• Complete all objectives within the time limit",
      "• Use specific gestures to interact with objects",
      "• Earn points for accuracy and combos",
      "• Difficulty increases over time"
    ],
    speed: [
      "• Perform gestures as quickly as possible",
      "• Maintain high accuracy for bonus points",
      "• Limited gesture set for faster recognition",
      "• Beat your best time and score"
    ],
    memory: [
      "• Watch the gesture sequence carefully",
      "• Repeat the sequence exactly as shown",
      "• Sequences get longer as you progress",
      "• Test your memory and precision"
    ]
  };

  return instructions[mode.id] || ["• Follow on-screen instructions"];
};

export default GameModeSelector;
