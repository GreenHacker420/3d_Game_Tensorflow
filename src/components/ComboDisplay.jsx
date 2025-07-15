import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllCombos } from '../utils/GestureSequence';
import './ComboDisplay.css';

const ComboDisplay = ({ 
  activeCombo = null, 
  gestureHistory = [], 
  onComboCompleted = () => {},
  isMinimized = false,
  onToggleMinimize = () => {}
}) => {
  const [showAllCombos, setShowAllCombos] = useState(false);
  const [completedCombo, setCompletedCombo] = useState(null);
  const [comboScore, setComboScore] = useState(0);

  const allCombos = getAllCombos();

  // Handle combo completion animation
  useEffect(() => {
    if (activeCombo && activeCombo.progress === 1.0) {
      setCompletedCombo(activeCombo);
      setComboScore(prev => prev + activeCombo.points);
      
      // Clear completed combo after animation
      setTimeout(() => {
        setCompletedCombo(null);
        onComboCompleted(activeCombo);
      }, 2000);
    }
  }, [activeCombo, onComboCompleted]);

  const getGestureEmoji = (gesture) => {
    const gestureEmojis = {
      'open_hand': '✋',
      'closed_fist': '✊',
      'pinch': '🤏',
      'point': '👆',
      'victory': '✌️',
      'thumbs_up': '👍',
      'rock_on': '🤘',
      'ok_sign': '👌',
      'no_hand': '❌'
    };
    return gestureEmojis[gesture] || '❓';
  };

  const renderSequenceProgress = (combo) => {
    const progress = activeCombo && activeCombo.id === combo.id ? activeCombo.progress : 0;
    const completedSteps = Math.floor(progress * combo.sequence.length);
    
    return (
      <div className="sequence-progress">
        {combo.sequence.map((gesture, index) => (
          <motion.div
            key={index}
            className={`sequence-step ${index < completedSteps ? 'completed' : ''} ${index === completedSteps ? 'active' : ''}`}
            animate={{
              scale: index === completedSteps ? [1, 1.2, 1] : 1,
              opacity: index < completedSteps ? 1 : 0.5
            }}
            transition={{ duration: 0.3 }}
          >
            {getGestureEmoji(gesture)}
          </motion.div>
        ))}
        <div className="sequence-arrow">→</div>
        <div className="sequence-effect">{combo.emoji}</div>
      </div>
    );
  };

  if (isMinimized) {
    return (
      <motion.div 
        className="combo-display minimized"
        onClick={onToggleMinimize}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="minimized-content">
          {activeCombo ? (
            <div className="active-combo-mini">
              <span className="combo-emoji">{activeCombo.emoji}</span>
              <div className="progress-ring">
                <svg width="40" height="40">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="2"
                  />
                  <motion.circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="#4CAF50"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 16}`}
                    strokeDashoffset={`${2 * Math.PI * 16 * (1 - activeCombo.progress)}`}
                    animate={{ strokeDashoffset: `${2 * Math.PI * 16 * (1 - activeCombo.progress)}` }}
                    transition={{ duration: 0.3 }}
                  />
                </svg>
              </div>
            </div>
          ) : (
            <span className="combo-icon">🎯</span>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="combo-display"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="combo-header">
        <h3>🎯 Gesture Combos</h3>
        <div className="header-controls">
          <button
            className="toggle-btn"
            onClick={() => setShowAllCombos(!showAllCombos)}
            title={showAllCombos ? 'Hide All Combos' : 'Show All Combos'}
          >
            {showAllCombos ? '📖' : '📚'}
          </button>
          <button
            className="minimize-btn"
            onClick={onToggleMinimize}
            title="Minimize Combo Display"
          >
            📕
          </button>
        </div>
      </div>

      {/* Score Display */}
      <div className="combo-score">
        <span className="score-label">Combo Score:</span>
        <motion.span 
          className="score-value"
          key={comboScore}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.3 }}
        >
          {comboScore}
        </motion.span>
      </div>

      {/* Active Combo */}
      <AnimatePresence>
        {activeCombo && (
          <motion.div
            className="active-combo"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <div className="combo-info">
              <div className="combo-name">
                <span className="combo-emoji">{activeCombo.emoji}</span>
                <span className="combo-title">{activeCombo.name}</span>
              </div>
              <div className="combo-description">{activeCombo.description}</div>
              <div className="combo-effect">Effect: {activeCombo.effect}</div>
            </div>
            
            {renderSequenceProgress(activeCombo)}
            
            <div className="progress-bar">
              <motion.div 
                className="progress-fill"
                animate={{ width: `${activeCombo.progress * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            
            <div className="combo-points">+{activeCombo.points} points</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed Combo Animation */}
      <AnimatePresence>
        {completedCombo && (
          <motion.div
            className="completed-combo"
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ 
              opacity: 1, 
              scale: [0.5, 1.2, 1], 
              y: 0,
              rotate: [0, 5, -5, 0]
            }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="completion-burst">
              <div className="burst-emoji">{completedCombo.emoji}</div>
              <div className="burst-text">COMBO COMPLETE!</div>
              <div className="burst-points">+{completedCombo.points}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All Combos List */}
      <AnimatePresence>
        {showAllCombos && (
          <motion.div
            className="all-combos"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h4>Available Combos:</h4>
            <div className="combos-grid">
              {allCombos.map(combo => (
                <motion.div
                  key={combo.id}
                  className={`combo-card ${activeCombo && activeCombo.id === combo.id ? 'active' : ''}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="card-header">
                    <span className="card-emoji">{combo.emoji}</span>
                    <span className="card-name">{combo.name}</span>
                  </div>
                  <div className="card-sequence">
                    {combo.sequence.map((gesture, index) => (
                      <span key={index} className="sequence-gesture">
                        {getGestureEmoji(gesture)}
                        {index < combo.sequence.length - 1 && <span className="sequence-separator">→</span>}
                      </span>
                    ))}
                  </div>
                  <div className="card-effect">{combo.effect}</div>
                  <div className="card-points">{combo.points} pts</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Gestures */}
      {gestureHistory.length > 0 && (
        <div className="recent-gestures">
          <h4>Recent Gestures:</h4>
          <div className="gesture-trail">
            {gestureHistory.slice(-5).map((gestureData, index) => (
              <motion.span
                key={`${gestureData.gesture}-${gestureData.timestamp}`}
                className="trail-gesture"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {getGestureEmoji(gestureData.gesture)}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ComboDisplay;
