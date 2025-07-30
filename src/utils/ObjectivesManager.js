import { GAME_MODES, CHALLENGE_OBJECTIVES } from './GameModes.js';

/**
 * Manages game objectives, progress tracking, and completion validation
 */
export class ObjectivesManager {
  constructor() {
    this.currentObjectives = [];
    this.progress = this.getInitialProgress();
    this.completedObjectives = [];
    this.onObjectiveComplete = null;
    this.onProgressUpdate = null;
    
    // Game session tracking
    this.sessionStartTime = null;
    this.isActive = false;
  }

  /**
   * Get initial progress state
   */
  getInitialProgress() {
    return {
      gestureCount: {},
      combosCompleted: 0,
      objectsInteracted: new Set(),
      timeElapsed: 0,
      correctGestures: 0,
      totalGestures: 0,
      score: 0,
      level: 1,
      streakCount: 0,
      maxStreak: 0
    };
  }

  /**
   * Start objectives for a specific game mode
   */
  startGameMode(gameMode) {
    this.isActive = true;
    this.sessionStartTime = Date.now();
    this.progress = this.getInitialProgress();
    this.completedObjectives = [];
    
    const mode = GAME_MODES[gameMode.toUpperCase()];
    if (!mode || !mode.features.objectives) {
      this.currentObjectives = [];
      return;
    }

    // Generate objectives based on game mode
    this.currentObjectives = this.generateObjectivesForMode(mode);
    console.log(`🎯 Started ${mode.name} with ${this.currentObjectives.length} objectives`);
  }

  /**
   * Generate objectives for a specific game mode
   */
  generateObjectivesForMode(mode) {
    const objectives = [];

    switch (mode.id) {
      case 'creative':
        // Creative mode has optional objectives
        objectives.push(
          this.createObjective(CHALLENGE_OBJECTIVES.GESTURE_COUNT, { target: 50, gesture: 'open_hand' }),
          this.createObjective(CHALLENGE_OBJECTIVES.OBJECT_INTERACTION, { target: 4 })
        );
        break;

      case 'challenge':
        // Challenge mode has specific objectives
        objectives.push(
          this.createObjective(CHALLENGE_OBJECTIVES.GESTURE_COUNT, { target: 25, gesture: 'closed_fist' }),
          this.createObjective(CHALLENGE_OBJECTIVES.COMBO_COMPLETE, { target: 5 }),
          this.createObjective(CHALLENGE_OBJECTIVES.ACCURACY_CHALLENGE, { target: 80 }),
          this.createObjective(CHALLENGE_OBJECTIVES.OBJECT_INTERACTION, { target: 3 })
        );
        break;

      case 'speed':
        // Speed mode focuses on quick interactions
        objectives.push(
          this.createObjective(CHALLENGE_OBJECTIVES.GESTURE_COUNT, { target: 30, gesture: 'pinch' }),
          this.createObjective(CHALLENGE_OBJECTIVES.TIME_SURVIVAL, { target: 60 }),
          this.createObjective(CHALLENGE_OBJECTIVES.ACCURACY_CHALLENGE, { target: 70 })
        );
        break;

      case 'memory':
        // Memory mode focuses on sequences
        objectives.push(
          this.createObjective(CHALLENGE_OBJECTIVES.COMBO_COMPLETE, { target: 10 }),
          this.createObjective(CHALLENGE_OBJECTIVES.ACCURACY_CHALLENGE, { target: 90 }),
          this.createObjective(CHALLENGE_OBJECTIVES.GESTURE_COUNT, { target: 20, gesture: 'victory' })
        );
        break;
    }

    return objectives;
  }

  /**
   * Create an objective instance
   */
  createObjective(template, params) {
    return {
      id: `${template.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      template: template.id,
      name: template.name,
      description: this.formatDescription(template.description, params),
      type: template.type,
      target: params.target,
      gesture: params.gesture,
      progress: 0,
      completed: false,
      validate: template.validate
    };
  }

  /**
   * Format objective description with parameters
   */
  formatDescription(description, params) {
    return description
      .replace('{target}', params.target)
      .replace('{gesture}', params.gesture || 'any');
  }

  /**
   * Update progress based on game events
   */
  updateProgress(event, data = {}) {
    if (!this.isActive) return;

    // Update time elapsed
    if (this.sessionStartTime) {
      this.progress.timeElapsed = (Date.now() - this.sessionStartTime) / 1000;
    }

    switch (event) {
      case 'gesture_performed':
        this.handleGesturePerformed(data);
        break;
      case 'combo_completed':
        this.handleComboCompleted(data);
        break;
      case 'object_interacted':
        this.handleObjectInteracted(data);
        break;
      case 'score_updated':
        this.handleScoreUpdated(data);
        break;
    }

    // Check objective completion
    this.checkObjectiveCompletion();
    
    // Notify progress update
    if (this.onProgressUpdate) {
      this.onProgressUpdate(this.progress, this.currentObjectives);
    }
  }

  /**
   * Handle gesture performed event
   */
  handleGesturePerformed(data) {
    const { gesture, confidence, correct = true } = data;
    
    // Update gesture counts
    if (!this.progress.gestureCount[gesture]) {
      this.progress.gestureCount[gesture] = 0;
    }
    this.progress.gestureCount[gesture]++;
    
    // Update accuracy tracking
    this.progress.totalGestures++;
    if (correct && confidence > 0.7) {
      this.progress.correctGestures++;
      this.progress.streakCount++;
      this.progress.maxStreak = Math.max(this.progress.maxStreak, this.progress.streakCount);
    } else {
      this.progress.streakCount = 0;
    }
  }

  /**
   * Handle combo completed event
   */
  handleComboCompleted(data) {
    this.progress.combosCompleted++;
  }

  /**
   * Handle object interaction event
   */
  handleObjectInteracted(data) {
    const { objectId, objectType } = data;
    this.progress.objectsInteracted.add(objectId);
  }

  /**
   * Handle score update event
   */
  handleScoreUpdated(data) {
    const { score, level } = data;
    this.progress.score = score;
    this.progress.level = level;
  }

  /**
   * Check if any objectives are completed
   */
  checkObjectiveCompletion() {
    this.currentObjectives.forEach(objective => {
      if (!objective.completed && objective.validate) {
        const isCompleted = objective.validate(this.progress, objective.target, objective.gesture);
        
        if (isCompleted) {
          objective.completed = true;
          objective.progress = 100;
          this.completedObjectives.push(objective);
          
          console.log(`🎉 Objective completed: ${objective.name}`);
          
          if (this.onObjectiveComplete) {
            this.onObjectiveComplete(objective);
          }
        } else {
          // Update progress percentage
          objective.progress = this.calculateObjectiveProgress(objective);
        }
      }
    });
  }

  /**
   * Calculate progress percentage for an objective
   */
  calculateObjectiveProgress(objective) {
    switch (objective.type) {
      case 'count':
        const count = this.progress.gestureCount[objective.gesture] || 0;
        return Math.min(100, (count / objective.target) * 100);
      
      case 'combo':
        return Math.min(100, (this.progress.combosCompleted / objective.target) * 100);
      
      case 'interaction':
        return Math.min(100, (this.progress.objectsInteracted.size / objective.target) * 100);
      
      case 'time':
        return Math.min(100, (this.progress.timeElapsed / objective.target) * 100);
      
      case 'accuracy':
        if (this.progress.totalGestures === 0) return 0;
        const accuracy = (this.progress.correctGestures / this.progress.totalGestures) * 100;
        return accuracy >= objective.target ? 100 : (accuracy / objective.target) * 100;
      
      default:
        return 0;
    }
  }

  /**
   * Get current objectives status
   */
  getObjectivesStatus() {
    return {
      objectives: this.currentObjectives,
      completed: this.completedObjectives,
      progress: this.progress,
      isActive: this.isActive,
      completionRate: this.currentObjectives.length > 0 
        ? (this.completedObjectives.length / this.currentObjectives.length) * 100 
        : 0
    };
  }

  /**
   * Stop objectives tracking
   */
  stop() {
    this.isActive = false;
    this.sessionStartTime = null;
  }

  /**
   * Reset objectives manager
   */
  reset() {
    this.currentObjectives = [];
    this.progress = this.getInitialProgress();
    this.completedObjectives = [];
    this.isActive = false;
    this.sessionStartTime = null;
  }

  /**
   * Set event handlers
   */
  setEventHandlers({ onObjectiveComplete, onProgressUpdate }) {
    this.onObjectiveComplete = onObjectiveComplete;
    this.onProgressUpdate = onProgressUpdate;
  }
}

export default ObjectivesManager;
