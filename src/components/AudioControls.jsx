import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioManager } from '../utils/AudioManager';
import './AudioControls.css';

const AudioControls = ({ 
  isMinimized = false,
  onToggleMinimize = () => {}
}) => {
  const [audioInfo, setAudioInfo] = useState(audioManager.getAudioInfo());
  const [isExpanded, setIsExpanded] = useState(false);
  const [testSound, setTestSound] = useState(null);

  useEffect(() => {
    // Update audio info periodically
    const interval = setInterval(() => {
      setAudioInfo(audioManager.getAudioInfo());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleVolumeChange = (type, value) => {
    const volume = parseFloat(value);
    
    switch (type) {
      case 'master':
        audioManager.setMasterVolume(volume);
        break;
      case 'sfx':
        audioManager.setSFXVolume(volume);
        break;
      case 'music':
        audioManager.setMusicVolume(volume);
        break;
    }
    
    setAudioInfo(audioManager.getAudioInfo());
  };

  const handleToggleAudio = () => {
    audioManager.setEnabled(!audioInfo.enabled);
    setAudioInfo(audioManager.getAudioInfo());
  };

  const handleTestSound = (soundName) => {
    setTestSound(soundName);
    audioManager.playSound(soundName);
    
    // Clear test sound indicator after a delay
    setTimeout(() => setTestSound(null), 500);
  };

  const handleResumeAudio = async () => {
    await audioManager.resumeAudioContext();
    setAudioInfo(audioManager.getAudioInfo());
  };

  const getContextStateColor = () => {
    switch (audioInfo.contextState) {
      case 'running': return '#4CAF50';
      case 'suspended': return '#FF9800';
      case 'closed': return '#F44336';
      default: return '#666';
    }
  };

  const testSounds = [
    { name: 'pinch', label: 'Pinch', emoji: '🤏' },
    { name: 'victory', label: 'Victory', emoji: '✌️' },
    { name: 'combo_complete', label: 'Combo', emoji: '🎉' },
    { name: 'success', label: 'Success', emoji: '✅' }
  ];

  if (isMinimized) {
    return (
      <motion.div 
        className="audio-controls minimized"
        onClick={onToggleMinimize}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="minimized-content">
          <span className="audio-icon">
            {audioInfo.enabled ? '🔊' : '🔇'}
          </span>
          <div 
            className="audio-status-dot"
            style={{ backgroundColor: getContextStateColor() }}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="audio-controls"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="audio-header">
        <h3>🔊 Audio Controls</h3>
        <div className="header-controls">
          <button
            className="expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '📖' : '📚'}
          </button>
          <button
            className="minimize-btn"
            onClick={onToggleMinimize}
            title="Minimize Audio Controls"
          >
            📕
          </button>
        </div>
      </div>

      {/* Audio Status */}
      <div className="audio-status">
        <div className="status-item">
          <span className="status-label">Status:</span>
          <div className="status-indicator">
            <div 
              className="status-dot"
              style={{ backgroundColor: getContextStateColor() }}
            />
            <span className="status-text">{audioInfo.contextState}</span>
          </div>
        </div>
        
        <div className="status-item">
          <span className="status-label">Sounds:</span>
          <span className="status-value">{audioInfo.soundCount}</span>
        </div>
      </div>

      {/* Audio Context Warning */}
      {audioInfo.contextState === 'suspended' && (
        <motion.div
          className="audio-warning"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p>🔇 Audio is suspended. Click to enable:</p>
          <button 
            className="resume-btn"
            onClick={handleResumeAudio}
          >
            🔊 Enable Audio
          </button>
        </motion.div>
      )}

      {/* Master Controls */}
      <div className="audio-section">
        <div className="section-header">
          <h4>Master Controls</h4>
          <button
            className={`toggle-btn ${audioInfo.enabled ? 'enabled' : 'disabled'}`}
            onClick={handleToggleAudio}
            title={audioInfo.enabled ? 'Disable Audio' : 'Enable Audio'}
          >
            {audioInfo.enabled ? '🔊' : '🔇'}
          </button>
        </div>

        {audioInfo.enabled && (
          <div className="volume-controls">
            <div className="volume-control">
              <label>Master Volume</label>
              <div className="volume-slider-container">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={audioInfo.masterVolume}
                  onChange={(e) => handleVolumeChange('master', e.target.value)}
                  className="volume-slider"
                />
                <span className="volume-value">
                  {Math.round(audioInfo.masterVolume * 100)}%
                </span>
              </div>
            </div>

            <div className="volume-control">
              <label>Sound Effects</label>
              <div className="volume-slider-container">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={audioInfo.sfxVolume}
                  onChange={(e) => handleVolumeChange('sfx', e.target.value)}
                  className="volume-slider"
                />
                <span className="volume-value">
                  {Math.round(audioInfo.sfxVolume * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sound Test Section */}
      <AnimatePresence>
        {isExpanded && audioInfo.enabled && (
          <motion.div
            className="audio-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h4>🎵 Sound Test</h4>
            <div className="test-sounds">
              {testSounds.map(sound => (
                <motion.button
                  key={sound.name}
                  className={`test-sound-btn ${testSound === sound.name ? 'playing' : ''}`}
                  onClick={() => handleTestSound(sound.name)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    backgroundColor: testSound === sound.name ? '#4CAF50' : 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <span className="sound-emoji">{sound.emoji}</span>
                  <span className="sound-label">{sound.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Info */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="audio-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h4>ℹ️ Audio Info</h4>
            <div className="audio-info">
              <div className="info-item">
                <span className="info-label">Context State:</span>
                <span className="info-value">{audioInfo.contextState}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Available Sounds:</span>
                <span className="info-value">{audioInfo.soundCount}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Audio Enabled:</span>
                <span className="info-value">{audioInfo.enabled ? 'Yes' : 'No'}</span>
              </div>
            </div>
            
            <div className="audio-features">
              <h5>🎼 Features:</h5>
              <ul>
                <li>• Procedural sound generation</li>
                <li>• Gesture-based audio feedback</li>
                <li>• Real-time volume control</li>
                <li>• Combo completion fanfares</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AudioControls;
