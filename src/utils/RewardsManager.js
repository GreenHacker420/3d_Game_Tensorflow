import { GESTURE_COMBOS } from './GestureSequence.js';

/**
 * Manages game rewards, feedback, and special effects for gesture combos
 */
export class RewardsManager {
  constructor() {
    this.activeRewards = [];
    this.rewardHistory = [];
    this.totalRewardsEarned = 0;
    this.comboStreak = 0;
    this.maxComboStreak = 0;
    
    // Event handlers
    this.onRewardEarned = null;
    this.onSpecialEffect = null;
    this.onScoreUpdate = null;
    
    // Reward multipliers
    this.streakMultiplier = 1.0;
    this.difficultyMultiplier = 1.0;
  }

  /**
   * Process a completed gesture combo and award rewards
   */
  processComboReward(comboId, gestureSequence, confidence = 1.0) {
    const combo = GESTURE_COMBOS[comboId.toUpperCase()];
    if (!combo) {
      console.warn('Unknown combo:', comboId);
      return null;
    }

    // Calculate reward points with multipliers
    const basePoints = combo.points;
    const confidenceBonus = Math.max(0, (confidence - 0.7) * 100); // Bonus for high confidence
    const streakBonus = this.comboStreak * 10; // 10 points per streak
    
    const totalPoints = Math.round(
      (basePoints + confidenceBonus + streakBonus) * 
      this.streakMultiplier * 
      this.difficultyMultiplier
    );

    // Create reward object
    const reward = {
      id: `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      comboId: combo.id,
      comboName: combo.name,
      points: totalPoints,
      basePoints: basePoints,
      bonusPoints: confidenceBonus + streakBonus,
      effect: combo.effect,
      emoji: combo.emoji,
      timestamp: Date.now(),
      gestureSequence: gestureSequence,
      confidence: confidence,
      streakCount: this.comboStreak + 1
    };

    // Update streak
    this.comboStreak++;
    this.maxComboStreak = Math.max(this.maxComboStreak, this.comboStreak);
    this.updateStreakMultiplier();

    // Add to active rewards and history
    this.activeRewards.push(reward);
    this.rewardHistory.push(reward);
    this.totalRewardsEarned += totalPoints;

    // Trigger special effects
    this.triggerSpecialEffect(combo, reward);

    // Notify listeners
    if (this.onRewardEarned) {
      this.onRewardEarned(reward);
    }

    if (this.onScoreUpdate) {
      this.onScoreUpdate(totalPoints, this.totalRewardsEarned);
    }

    console.log(`🎉 Combo reward earned: ${combo.name} (+${totalPoints} points)`);
    return reward;
  }

  /**
   * Update streak multiplier based on current streak
   */
  updateStreakMultiplier() {
    if (this.comboStreak >= 10) {
      this.streakMultiplier = 2.0;
    } else if (this.comboStreak >= 5) {
      this.streakMultiplier = 1.5;
    } else if (this.comboStreak >= 3) {
      this.streakMultiplier = 1.2;
    } else {
      this.streakMultiplier = 1.0;
    }
  }

  /**
   * Trigger special effects for combo
   */
  triggerSpecialEffect(combo, reward) {
    const effect = {
      type: combo.id,
      name: combo.effect,
      duration: this.getEffectDuration(combo.id),
      intensity: Math.min(2.0, 1.0 + (this.comboStreak * 0.1)),
      reward: reward
    };

    switch (combo.id) {
      case 'power_up':
        effect.data = {
          powerMultiplier: 1.5 + (this.comboStreak * 0.1),
          glowColor: '#ff6b35',
          particleCount: 20 + this.comboStreak
        };
        break;

      case 'magic_touch':
        effect.data = {
          particleType: 'sparkles',
          colors: ['#ffd700', '#ff69b4', '#00ffff'],
          particleCount: 30 + this.comboStreak,
          trailEffect: true
        };
        break;

      case 'rock_star':
        effect.data = {
          lightingPreset: 'dramatic',
          strobeEffect: true,
          colorCycle: ['#ff0000', '#00ff00', '#0000ff'],
          intensity: 1.5 + (this.comboStreak * 0.2)
        };
        break;

      case 'precision_master':
        effect.data = {
          precisionMode: true,
          targetHighlight: true,
          snapToGrid: true,
          guidanceLines: true
        };
        break;

      case 'celebration':
        effect.data = {
          confettiExplosion: true,
          celebrationSound: true,
          cameraShake: 0.5 + (this.comboStreak * 0.1),
          fireworks: this.comboStreak >= 3
        };
        break;
    }

    if (this.onSpecialEffect) {
      this.onSpecialEffect(effect);
    }

    // Auto-remove effect after duration
    setTimeout(() => {
      this.removeActiveReward(reward.id);
    }, effect.duration);
  }

  /**
   * Get effect duration based on combo type
   */
  getEffectDuration(comboId) {
    const durations = {
      power_up: 5000,
      magic_touch: 3000,
      rock_star: 4000,
      precision_master: 8000,
      celebration: 2000
    };
    return durations[comboId] || 3000;
  }

  /**
   * Remove an active reward
   */
  removeActiveReward(rewardId) {
    this.activeRewards = this.activeRewards.filter(r => r.id !== rewardId);
  }

  /**
   * Reset combo streak (called when player makes mistake or pauses)
   */
  resetStreak() {
    if (this.comboStreak > 0) {
      console.log(`💔 Combo streak broken at ${this.comboStreak}`);
    }
    this.comboStreak = 0;
    this.streakMultiplier = 1.0;
  }

  /**
   * Set difficulty multiplier
   */
  setDifficultyMultiplier(multiplier) {
    this.difficultyMultiplier = Math.max(0.1, Math.min(3.0, multiplier));
  }

  /**
   * Get current rewards status
   */
  getRewardsStatus() {
    return {
      activeRewards: this.activeRewards,
      totalPoints: this.totalRewardsEarned,
      comboStreak: this.comboStreak,
      maxComboStreak: this.maxComboStreak,
      streakMultiplier: this.streakMultiplier,
      difficultyMultiplier: this.difficultyMultiplier,
      recentRewards: this.rewardHistory.slice(-10) // Last 10 rewards
    };
  }

  /**
   * Get available combos information
   */
  getAvailableCombos() {
    return Object.values(GESTURE_COMBOS).map(combo => ({
      id: combo.id,
      name: combo.name,
      description: combo.description,
      effect: combo.effect,
      points: combo.points,
      emoji: combo.emoji,
      sequence: combo.sequence
    }));
  }

  /**
   * Set event handlers
   */
  setEventHandlers({ onRewardEarned, onSpecialEffect, onScoreUpdate }) {
    this.onRewardEarned = onRewardEarned;
    this.onSpecialEffect = onSpecialEffect;
    this.onScoreUpdate = onScoreUpdate;
  }

  /**
   * Reset rewards manager
   */
  reset() {
    this.activeRewards = [];
    this.rewardHistory = [];
    this.totalRewardsEarned = 0;
    this.comboStreak = 0;
    this.maxComboStreak = 0;
    this.streakMultiplier = 1.0;
    this.difficultyMultiplier = 1.0;
  }

  /**
   * Get combo statistics
   */
  getComboStatistics() {
    const stats = {};
    
    // Count each combo type
    Object.keys(GESTURE_COMBOS).forEach(comboId => {
      stats[comboId] = {
        count: 0,
        totalPoints: 0,
        bestStreak: 0
      };
    });

    // Analyze reward history
    this.rewardHistory.forEach(reward => {
      const comboId = reward.comboId.toUpperCase();
      if (stats[comboId]) {
        stats[comboId].count++;
        stats[comboId].totalPoints += reward.points;
        stats[comboId].bestStreak = Math.max(stats[comboId].bestStreak, reward.streakCount);
      }
    });

    return stats;
  }
}

export default RewardsManager;
