import { GESTURE_TYPES } from './gestureRecognition';
import { GESTURE_COMBOS } from './GestureSequence';

// Game mode definitions
export const GAME_MODES = {
  CREATIVE: {
    id: 'creative',
    name: 'Creative Mode',
    description: 'Free play with all objects and gestures available',
    icon: '🎨',
    features: {
      timeLimit: false,
      scoring: false,
      objectives: false,
      allGesturesEnabled: true,
      allObjectsEnabled: true,
      physicsEnabled: true,
      comboSystem: true
    },
    settings: {
      objectSpawnRate: 0,
      difficultyScaling: false,
      gestureRequirements: []
    }
  },
  
  CHALLENGE: {
    id: 'challenge',
    name: 'Challenge Mode',
    description: 'Complete specific objectives with limited time',
    icon: '🎯',
    features: {
      timeLimit: true,
      scoring: true,
      objectives: true,
      allGesturesEnabled: true,
      allObjectsEnabled: false,
      physicsEnabled: true,
      comboSystem: true
    },
    settings: {
      timeLimit: 120, // seconds
      objectSpawnRate: 5, // seconds
      difficultyScaling: true,
      gestureRequirements: ['pinch', 'open_hand', 'victory']
    }
  },
  
  SPEED: {
    id: 'speed',
    name: 'Speed Mode',
    description: 'Perform gestures as fast as possible',
    icon: '⚡',
    features: {
      timeLimit: true,
      scoring: true,
      objectives: true,
      allGesturesEnabled: false,
      allObjectsEnabled: false,
      physicsEnabled: false,
      comboSystem: false
    },
    settings: {
      timeLimit: 60, // seconds
      objectSpawnRate: 2, // seconds
      difficultyScaling: true,
      gestureRequirements: ['pinch', 'open_hand', 'closed_fist', 'victory'],
      speedMultiplier: 2.0
    }
  },
  
  MEMORY: {
    id: 'memory',
    name: 'Memory Mode',
    description: 'Remember and repeat gesture sequences',
    icon: '🧠',
    features: {
      timeLimit: false,
      scoring: true,
      objectives: true,
      allGesturesEnabled: false,
      allObjectsEnabled: false,
      physicsEnabled: false,
      comboSystem: false
    },
    settings: {
      sequenceLength: 3,
      showTime: 3000, // ms
      recallTime: 10000, // ms
      difficultyScaling: true,
      gestureRequirements: ['open_hand', 'closed_fist', 'pinch', 'victory', 'thumbs_up']
    }
  }
};

// Challenge objectives
export const CHALLENGE_OBJECTIVES = {
  GESTURE_COUNT: {
    id: 'gesture_count',
    name: 'Gesture Master',
    description: 'Perform {target} {gesture} gestures',
    type: 'count',
    validate: (progress, target, gesture) => {
      return progress.gestureCount[gesture] >= target;
    }
  },
  
  COMBO_COMPLETE: {
    id: 'combo_complete',
    name: 'Combo Expert',
    description: 'Complete {target} gesture combos',
    type: 'combo',
    validate: (progress, target) => {
      return progress.combosCompleted >= target;
    }
  },
  
  OBJECT_INTERACTION: {
    id: 'object_interaction',
    name: 'Object Manipulator',
    description: 'Interact with {target} different objects',
    type: 'interaction',
    validate: (progress, target) => {
      return progress.objectsInteracted.size >= target;
    }
  },
  
  TIME_SURVIVAL: {
    id: 'time_survival',
    name: 'Endurance Test',
    description: 'Survive for {target} seconds',
    type: 'time',
    validate: (progress, target) => {
      return progress.timeElapsed >= target;
    }
  },
  
  ACCURACY_CHALLENGE: {
    id: 'accuracy_challenge',
    name: 'Precision Expert',
    description: 'Maintain {target}% gesture accuracy',
    type: 'accuracy',
    validate: (progress, target) => {
      const accuracy = (progress.correctGestures / progress.totalGestures) * 100;
      return accuracy >= target;
    }
  }
};

export class GameModeManager {
  constructor(gameStore) {
    this.gameStore = gameStore;
    this.currentMode = null;
    this.modeState = {};
    this.objectives = [];
    this.progress = {};
    this.startTime = null;
    this.endTime = null;
    this.timer = null;
  }

  // Start a game mode
  startMode(modeId, customSettings = {}) {
    const mode = GAME_MODES[modeId.toUpperCase()];
    if (!mode) {
      console.error('Unknown game mode:', modeId);
      return false;
    }

    this.currentMode = {
      ...mode,
      settings: { ...mode.settings, ...customSettings }
    };

    this.initializeModeState();
    this.generateObjectives();
    this.startTimer();

    console.log(`🎮 Started ${mode.name}`);
    return true;
  }

  // Initialize mode-specific state
  initializeModeState() {
    this.modeState = {
      score: 0,
      level: 1,
      timeRemaining: this.currentMode.settings.timeLimit || null,
      isActive: true,
      isPaused: false
    };

    this.progress = {
      gestureCount: {},
      combosCompleted: 0,
      objectsInteracted: new Set(),
      timeElapsed: 0,
      correctGestures: 0,
      totalGestures: 0,
      sequenceProgress: []
    };

    this.startTime = Date.now();
    this.endTime = null;

    // Initialize gesture counts
    Object.values(GESTURE_TYPES).forEach(gesture => {
      this.progress.gestureCount[gesture] = 0;
    });
  }

  // Generate objectives based on mode
  generateObjectives() {
    this.objectives = [];

    switch (this.currentMode.id) {
      case 'challenge':
        this.objectives = [
          {
            ...CHALLENGE_OBJECTIVES.GESTURE_COUNT,
            target: 10,
            gesture: 'pinch',
            description: 'Perform 10 pinch gestures'
          },
          {
            ...CHALLENGE_OBJECTIVES.COMBO_COMPLETE,
            target: 3,
            description: 'Complete 3 gesture combos'
          },
          {
            ...CHALLENGE_OBJECTIVES.OBJECT_INTERACTION,
            target: 4,
            description: 'Interact with 4 different objects'
          }
        ];
        break;

      case 'speed':
        this.objectives = [
          {
            ...CHALLENGE_OBJECTIVES.GESTURE_COUNT,
            target: 20,
            gesture: 'any',
            description: 'Perform 20 gestures quickly'
          },
          {
            ...CHALLENGE_OBJECTIVES.ACCURACY_CHALLENGE,
            target: 80,
            description: 'Maintain 80% accuracy'
          }
        ];
        break;

      case 'memory':
        this.objectives = [
          {
            id: 'sequence_recall',
            name: 'Memory Master',
            description: 'Complete 5 gesture sequences',
            type: 'sequence',
            target: 5,
            validate: (progress, target) => progress.sequenceProgress.length >= target
          }
        ];
        break;
    }
  }

  // Start game timer
  startTimer() {
    if (!this.currentMode.features.timeLimit) return;

    this.timer = setInterval(() => {
      if (this.modeState.isPaused) return;

      this.modeState.timeRemaining--;
      this.progress.timeElapsed = (Date.now() - this.startTime) / 1000;

      if (this.modeState.timeRemaining <= 0) {
        this.endMode('time_up');
      }

      // Update game store
      this.gameStore.getState().updatePerformance({
        timeRemaining: this.modeState.timeRemaining,
        timeElapsed: this.progress.timeElapsed
      });
    }, 1000);
  }

  // Process gesture input
  processGesture(gesture, confidence) {
    if (!this.modeState.isActive) return;

    this.progress.totalGestures++;
    
    if (confidence > 0.7) {
      this.progress.correctGestures++;
      this.progress.gestureCount[gesture]++;
      
      // Mode-specific processing
      switch (this.currentMode.id) {
        case 'speed':
          this.modeState.score += Math.round(confidence * 10 * this.currentMode.settings.speedMultiplier);
          break;
        case 'challenge':
          this.modeState.score += Math.round(confidence * 5);
          break;
        default:
          this.modeState.score += Math.round(confidence * 3);
      }
    }

    this.checkObjectives();
  }

  // Process combo completion
  processCombo(combo) {
    if (!this.modeState.isActive) return;

    this.progress.combosCompleted++;
    this.modeState.score += combo.points;

    this.checkObjectives();
  }

  // Process object interaction
  processObjectInteraction(objectId) {
    if (!this.modeState.isActive) return;

    this.progress.objectsInteracted.add(objectId);
    this.modeState.score += 10;

    this.checkObjectives();
  }

  // Check if objectives are completed
  checkObjectives() {
    const completedObjectives = this.objectives.filter(objective => 
      objective.validate(this.progress, objective.target, objective.gesture)
    );

    if (completedObjectives.length === this.objectives.length) {
      this.endMode('objectives_complete');
    }
  }

  // Pause/Resume mode
  pauseMode() {
    this.modeState.isPaused = true;
  }

  resumeMode() {
    this.modeState.isPaused = false;
  }

  // End game mode
  endMode(reason = 'manual') {
    this.modeState.isActive = false;
    this.endTime = Date.now();
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    const results = this.getResults();
    console.log(`🏁 Game mode ended: ${reason}`, results);

    return results;
  }

  // Get current results
  getResults() {
    const duration = this.endTime ? (this.endTime - this.startTime) / 1000 : (Date.now() - this.startTime) / 1000;
    const accuracy = this.progress.totalGestures > 0 ? (this.progress.correctGestures / this.progress.totalGestures) * 100 : 0;

    return {
      mode: this.currentMode,
      score: this.modeState.score,
      duration,
      accuracy,
      objectives: this.objectives.map(obj => ({
        ...obj,
        completed: obj.validate(this.progress, obj.target, obj.gesture)
      })),
      progress: this.progress,
      stats: {
        totalGestures: this.progress.totalGestures,
        correctGestures: this.progress.correctGestures,
        combosCompleted: this.progress.combosCompleted,
        objectsInteracted: this.progress.objectsInteracted.size
      }
    };
  }

  // Get current state
  getCurrentState() {
    return {
      mode: this.currentMode,
      state: this.modeState,
      objectives: this.objectives,
      progress: this.progress,
      isActive: this.modeState?.isActive || false
    };
  }
}

// Utility functions
export const getModeById = (id) => GAME_MODES[id.toUpperCase()];
export const getAllModes = () => Object.values(GAME_MODES);
export const getObjectiveById = (id) => CHALLENGE_OBJECTIVES[id.toUpperCase()];
