/**
 * Simple gesture classification for 3D object interaction
 * Focuses on core gestures: open hand, fist, pinch
 */

export const GESTURE_TYPES = {
  OPEN_HAND: 'open_hand',
  CLOSED_FIST: 'closed_fist', 
  PINCH: 'pinch',
  NO_HAND: 'no_hand'
};

export class GestureClassifier {
  constructor() {
    this.gestureHistory = [];
    this.historySize = 5;
    this.confidenceThreshold = 0.6;
  }

  /**
   * Classify gesture from hand landmarks
   * @param {Array} landmarks - Hand landmarks from MediaPipe
   * @returns {Object} Gesture classification result
   */
  classifyGesture(landmarks) {
    if (!landmarks || landmarks.length < 21) {
      return {
        gesture: GESTURE_TYPES.NO_HAND,
        confidence: 0,
        details: {}
      };
    }

    const gestures = [
      this.detectOpenHand(landmarks),
      this.detectClosedFist(landmarks),
      this.detectPinch(landmarks)
    ];

    // Find gesture with highest confidence
    const bestGesture = gestures.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    // Apply temporal smoothing
    const smoothedGesture = this.applySmoothingFilter(bestGesture);

    return {
      gesture: smoothedGesture.type,
      confidence: smoothedGesture.confidence,
      details: smoothedGesture.details
    };
  }

  /**
   * Detect open hand gesture
   * @param {Array} landmarks - Hand landmarks
   * @returns {Object} Detection result
   */
  detectOpenHand(landmarks) {
    const fingers = this.getFingerStates(landmarks);
    const extendedCount = fingers.filter(f => f.extended).length;
    
    // Open hand: most fingers extended
    const isOpen = extendedCount >= 3;
    const confidence = isOpen ? (extendedCount / 5) * 0.9 : 0.1;

    return {
      type: GESTURE_TYPES.OPEN_HAND,
      confidence,
      details: { extendedFingers: extendedCount }
    };
  }

  /**
   * Detect closed fist gesture
   * @param {Array} landmarks - Hand landmarks
   * @returns {Object} Detection result
   */
  detectClosedFist(landmarks) {
    const fingers = this.getFingerStates(landmarks);
    const bentCount = fingers.filter(f => !f.extended).length;
    
    // Closed fist: most fingers bent
    const isClosed = bentCount >= 4;
    const confidence = isClosed ? (bentCount / 5) * 0.9 : 0.1;

    return {
      type: GESTURE_TYPES.CLOSED_FIST,
      confidence,
      details: { bentFingers: bentCount }
    };
  }

  /**
   * Detect pinch gesture
   * @param {Array} landmarks - Hand landmarks
   * @returns {Object} Detection result
   */
  detectPinch(landmarks) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    
    const distance = this.calculateDistance(thumbTip, indexTip);
    const pinchThreshold = 30;
    
    const isPinched = distance < pinchThreshold;
    const confidence = isPinched ? Math.max(0.7, 1 - (distance / 50)) : 0.1;

    return {
      type: GESTURE_TYPES.PINCH,
      confidence,
      details: { distance, isPinched }
    };
  }

  /**
   * Get finger extension states
   * @param {Array} landmarks - Hand landmarks
   * @returns {Array} Finger states
   */
  getFingerStates(landmarks) {
    const fingers = [
      { name: 'thumb', joints: [1, 2, 3, 4] },
      { name: 'index', joints: [5, 6, 7, 8] },
      { name: 'middle', joints: [9, 10, 11, 12] },
      { name: 'ring', joints: [13, 14, 15, 16] },
      { name: 'pinky', joints: [17, 18, 19, 20] }
    ];

    return fingers.map(finger => ({
      name: finger.name,
      extended: this.isFingerExtended(landmarks, finger.joints)
    }));
  }

  /**
   * Check if finger is extended
   * @param {Array} landmarks - Hand landmarks
   * @param {Array} joints - Finger joint indices
   * @returns {boolean} True if finger is extended
   */
  isFingerExtended(landmarks, joints) {
    if (joints.length < 4) return false;

    const base = landmarks[joints[0]];
    const middle = landmarks[joints[2]];
    const tip = landmarks[joints[3]];

    // Calculate if tip is further from base than middle joint
    const baseToTip = this.calculateDistance(base, tip);
    const baseToMiddle = this.calculateDistance(base, middle);

    return baseToTip > baseToMiddle * 1.2;
  }

  /**
   * Calculate distance between two points
   * @param {Array} point1 - First point [x, y]
   * @param {Array} point2 - Second point [x, y]
   * @returns {number} Distance
   */
  calculateDistance(point1, point2) {
    const dx = point1[0] - point2[0];
    const dy = point1[1] - point2[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Apply temporal smoothing to reduce gesture jitter
   * @param {Object} gesture - Current gesture detection
   * @returns {Object} Smoothed gesture
   */
  applySmoothingFilter(gesture) {
    // Add to history
    this.gestureHistory.push(gesture);
    
    // Keep only recent history
    if (this.gestureHistory.length > this.historySize) {
      this.gestureHistory.shift();
    }

    // If we don't have enough history, return current gesture
    if (this.gestureHistory.length < 3) {
      return gesture;
    }

    // Count occurrences of each gesture type
    const gestureCounts = {};
    let totalConfidence = 0;

    this.gestureHistory.forEach(g => {
      gestureCounts[g.type] = (gestureCounts[g.type] || 0) + 1;
      totalConfidence += g.confidence;
    });

    // Find most common gesture
    const mostCommon = Object.keys(gestureCounts).reduce((a, b) => 
      gestureCounts[a] > gestureCounts[b] ? a : b
    );

    // Calculate average confidence
    const avgConfidence = totalConfidence / this.gestureHistory.length;

    return {
      type: mostCommon,
      confidence: Math.min(avgConfidence, 0.95),
      details: gesture.details
    };
  }

  /**
   * Reset gesture history
   */
  reset() {
    this.gestureHistory = [];
  }
}

export default GestureClassifier;
