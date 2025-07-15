import { GESTURE_TYPES } from './gestureRecognition';

// Predefined gesture sequences and combos
export const GESTURE_COMBOS = {
  POWER_UP: {
    id: 'power_up',
    name: 'Power Up',
    sequence: [GESTURE_TYPES.CLOSED_FIST, GESTURE_TYPES.VICTORY, GESTURE_TYPES.THUMBS_UP],
    description: 'Fist → Victory → Thumbs Up',
    effect: 'Increases object interaction power',
    points: 100,
    emoji: '💪'
  },
  MAGIC_TOUCH: {
    id: 'magic_touch',
    name: 'Magic Touch',
    sequence: [GESTURE_TYPES.OPEN_HAND, GESTURE_TYPES.PINCH, GESTURE_TYPES.OK_SIGN],
    description: 'Open Hand → Pinch → OK Sign',
    effect: 'Creates magical particle effects',
    points: 150,
    emoji: '✨'
  },
  ROCK_STAR: {
    id: 'rock_star',
    name: 'Rock Star',
    sequence: [GESTURE_TYPES.ROCK_ON, GESTURE_TYPES.ROCK_ON, GESTURE_TYPES.VICTORY],
    description: 'Rock On → Rock On → Victory',
    effect: 'Activates special lighting effects',
    points: 200,
    emoji: '🎸'
  },
  PRECISION_MASTER: {
    id: 'precision_master',
    name: 'Precision Master',
    sequence: [GESTURE_TYPES.POINT, GESTURE_TYPES.PINCH, GESTURE_TYPES.POINT],
    description: 'Point → Pinch → Point',
    effect: 'Enables precise object manipulation',
    points: 120,
    emoji: '🎯'
  },
  CELEBRATION: {
    id: 'celebration',
    name: 'Celebration',
    sequence: [GESTURE_TYPES.THUMBS_UP, GESTURE_TYPES.VICTORY, GESTURE_TYPES.THUMBS_UP],
    description: 'Thumbs Up → Victory → Thumbs Up',
    effect: 'Triggers celebration animation',
    points: 80,
    emoji: '🎉'
  }
};

export class GestureSequenceDetector {
  constructor(timeout = 3000) {
    this.timeout = timeout;
    this.gestureHistory = [];
    this.activeCombo = null;
    this.comboStartTime = null;
    this.onComboDetected = null;
    this.onComboCompleted = null;
    this.onComboFailed = null;
  }

  // Add a gesture to the sequence
  addGesture(gesture, confidence = 1.0) {
    const now = Date.now();
    
    // Clean old gestures
    this.cleanOldGestures(now);
    
    // Add new gesture
    this.gestureHistory.push({
      gesture,
      confidence,
      timestamp: now
    });

    // Check for combo matches
    this.checkForCombos();
    
    return this.activeCombo;
  }

  // Clean gestures older than timeout
  cleanOldGestures(currentTime) {
    this.gestureHistory = this.gestureHistory.filter(
      g => currentTime - g.timestamp < this.timeout
    );
  }

  // Check if current sequence matches any combo
  checkForCombos() {
    if (this.gestureHistory.length === 0) return;

    const currentSequence = this.gestureHistory.map(g => g.gesture);
    
    // Check each combo
    for (const combo of Object.values(GESTURE_COMBOS)) {
      const match = this.matchesSequence(currentSequence, combo.sequence);
      
      if (match.isComplete) {
        this.completeCombo(combo);
        return;
      } else if (match.isPartial && !this.activeCombo) {
        this.startCombo(combo, match.progress);
      } else if (this.activeCombo && this.activeCombo.id === combo.id) {
        if (!match.isPartial) {
          this.failCombo();
        } else {
          this.updateComboProgress(match.progress);
        }
      }
    }
  }

  // Check if current sequence matches a target sequence
  matchesSequence(current, target) {
    if (current.length === 0) return { isPartial: false, isComplete: false, progress: 0 };
    
    // Check for exact match at the end
    if (current.length >= target.length) {
      const lastN = current.slice(-target.length);
      if (this.arraysEqual(lastN, target)) {
        return { isPartial: false, isComplete: true, progress: 1.0 };
      }
    }
    
    // Check for partial match
    for (let i = 1; i <= Math.min(current.length, target.length); i++) {
      const currentSuffix = current.slice(-i);
      const targetPrefix = target.slice(0, i);
      
      if (this.arraysEqual(currentSuffix, targetPrefix)) {
        return { 
          isPartial: true, 
          isComplete: false, 
          progress: i / target.length 
        };
      }
    }
    
    return { isPartial: false, isComplete: false, progress: 0 };
  }

  // Helper to compare arrays
  arraysEqual(a, b) {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }

  // Start a new combo
  startCombo(combo, progress) {
    this.activeCombo = {
      ...combo,
      progress,
      startTime: Date.now()
    };
    
    if (this.onComboDetected) {
      this.onComboDetected(this.activeCombo);
    }
  }

  // Update combo progress
  updateComboProgress(progress) {
    if (this.activeCombo) {
      this.activeCombo.progress = progress;
    }
  }

  // Complete a combo
  completeCombo(combo) {
    const completedCombo = {
      ...combo,
      progress: 1.0,
      completionTime: Date.now(),
      duration: this.activeCombo ? Date.now() - this.activeCombo.startTime : 0
    };
    
    if (this.onComboCompleted) {
      this.onComboCompleted(completedCombo);
    }
    
    this.resetCombo();
    this.clearHistory();
  }

  // Fail current combo
  failCombo() {
    if (this.activeCombo && this.onComboFailed) {
      this.onComboFailed(this.activeCombo);
    }
    
    this.resetCombo();
  }

  // Reset active combo
  resetCombo() {
    this.activeCombo = null;
    this.comboStartTime = null;
  }

  // Clear gesture history
  clearHistory() {
    this.gestureHistory = [];
  }

  // Get current combo status
  getComboStatus() {
    return {
      activeCombo: this.activeCombo,
      gestureHistory: this.gestureHistory,
      availableCombos: Object.values(GESTURE_COMBOS)
    };
  }

  // Set event handlers
  setEventHandlers({ onComboDetected, onComboCompleted, onComboFailed }) {
    this.onComboDetected = onComboDetected;
    this.onComboCompleted = onComboCompleted;
    this.onComboFailed = onComboFailed;
  }
}

// Export utility functions
export const getComboBySequence = (sequence) => {
  return Object.values(GESTURE_COMBOS).find(combo => 
    combo.sequence.length === sequence.length &&
    combo.sequence.every((gesture, i) => gesture === sequence[i])
  );
};

export const getAllCombos = () => Object.values(GESTURE_COMBOS);

export const getComboById = (id) => GESTURE_COMBOS[id];
