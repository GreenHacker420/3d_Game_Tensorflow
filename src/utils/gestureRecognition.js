import * as tf from '@tensorflow/tfjs';

// Gesture types we can recognize
export const GESTURE_TYPES = {
  OPEN_HAND: 'open_hand',
  CLOSED_FIST: 'closed_fist',
  PINCH: 'pinch',
  POINT: 'point',
  VICTORY: 'victory',
  THUMBS_UP: 'thumbs_up',
  THUMBS_DOWN: 'thumbs_down',
  ROCK_ON: 'rock_on',
  PEACE: 'peace',
  OK_SIGN: 'ok_sign',
  NO_HAND: 'no_hand'
};

// Finger joint indices for MediaPipe Hand Pose
const FINGER_JOINTS = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20]
};

// Gesture detection thresholds
const GESTURE_THRESHOLDS = {
  PINCH_DISTANCE: 30,
  FINGER_EXTENDED_THRESHOLD: 0.8,
  FINGER_BENT_THRESHOLD: 0.3,
  HAND_CLOSED_THRESHOLD: 0.4,
  THUMB_ANGLE_THRESHOLD: 45
};

class GestureRecognition {
  constructor() {
    this.gestureHistory = [];
    this.confidenceThreshold = 0.7;
    this.gestureSmoothing = 0.8; // Smoothing factor for gesture detection
    this.lastGesture = null;
    this.gestureConfidence = 0;
    this.gestureStartTime = null;
    this.minGestureDuration = 500; // Minimum time to hold gesture (ms)
  }

  // Calculate distance between two 3D points
  calculateDistance(point1, point2) {
    return Math.sqrt(
      Math.pow(point1[0] - point2[0], 2) +
      Math.pow(point1[1] - point2[1], 2) +
      Math.pow(point1[2] - point2[2], 2)
    );
  }

  // Calculate angle between three points
  calculateAngle(point1, point2, point3) {
    const v1 = [point1[0] - point2[0], point1[1] - point2[1], point1[2] - point2[2]];
    const v2 = [point3[0] - point2[0], point3[1] - point2[1], point3[2] - point2[2]];
    
    const dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
    const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2]);
    const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1] + v2[2] * v2[2]);
    
    return Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
  }

  // Check if a finger is extended
  isFingerExtended(landmarks, fingerName) {
    const joints = FINGER_JOINTS[fingerName];
    if (!joints) return false;

    // Get finger joints
    const base = landmarks[joints[0]];
    const middle = landmarks[joints[2]];
    const tip = landmarks[joints[4]];

    // Calculate finger extension angle
    const angle = this.calculateAngle(base, middle, tip);
    
    // Finger is extended if angle is close to 180 degrees
    return angle > 160;
  }

  // Check if a finger is bent
  isFingerBent(landmarks, fingerName) {
    const joints = FINGER_JOINTS[fingerName];
    if (!joints) return false;

    const base = landmarks[joints[0]];
    const middle = landmarks[joints[2]];
    const tip = landmarks[joints[4]];

    const angle = this.calculateAngle(base, middle, tip);
    return angle < 120;
  }

  // Detect pinch gesture
  detectPinch(landmarks) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const distance = this.calculateDistance(thumbTip, indexTip);
    
    return {
      isPinched: distance < GESTURE_THRESHOLDS.PINCH_DISTANCE,
      distance: distance,
      confidence: Math.max(0, 1 - (distance / 100))
    };
  }

  // Detect open hand gesture
  detectOpenHand(landmarks) {
    const fingers = ['indexFinger', 'middleFinger', 'ringFinger', 'pinky'];
    let extendedFingers = 0;
    
    fingers.forEach(finger => {
      if (this.isFingerExtended(landmarks, finger)) {
        extendedFingers++;
      }
    });

    const isOpen = extendedFingers >= 3;
    const confidence = extendedFingers / 4;
    
    return { isOpen, extendedFingers, confidence };
  }

  // Detect closed fist
  detectClosedFist(landmarks) {
    const fingers = ['indexFinger', 'middleFinger', 'ringFinger', 'pinky'];
    let bentFingers = 0;
    
    fingers.forEach(finger => {
      if (this.isFingerBent(landmarks, finger)) {
        bentFingers++;
      }
    });

    const isClosed = bentFingers >= 3;
    const confidence = bentFingers / 4;
    
    return { isClosed, bentFingers, confidence };
  }

  // Detect pointing gesture
  detectPoint(landmarks) {
    const indexExtended = this.isFingerExtended(landmarks, 'indexFinger');
    const otherFingersBent = [
      this.isFingerBent(landmarks, 'middleFinger'),
      this.isFingerBent(landmarks, 'ringFinger'),
      this.isFingerBent(landmarks, 'pinky')
    ].filter(bent => bent).length;

    const isPointing = indexExtended && otherFingersBent >= 2;
    const confidence = isPointing ? 0.9 : 0.1;
    
    return { isPointing, confidence };
  }

  // Detect victory/peace sign
  detectVictory(landmarks) {
    const indexExtended = this.isFingerExtended(landmarks, 'indexFinger');
    const middleExtended = this.isFingerExtended(landmarks, 'middleFinger');
    const otherFingersBent = [
      this.isFingerBent(landmarks, 'ringFinger'),
      this.isFingerBent(landmarks, 'pinky')
    ].filter(bent => bent).length;

    const isVictory = indexExtended && middleExtended && otherFingersBent >= 1;
    const confidence = isVictory ? 0.9 : 0.1;
    
    return { isVictory, confidence };
  }

  // Detect thumbs up
  detectThumbsUp(landmarks) {
    const thumbExtended = this.isFingerExtended(landmarks, 'thumb');
    const otherFingersBent = [
      this.isFingerBent(landmarks, 'indexFinger'),
      this.isFingerBent(landmarks, 'middleFinger'),
      this.isFingerBent(landmarks, 'ringFinger'),
      this.isFingerBent(landmarks, 'pinky')
    ].filter(bent => bent).length;

    const isThumbsUp = thumbExtended && otherFingersBent >= 3;
    const confidence = isThumbsUp ? 0.9 : 0.1;
    
    return { isThumbsUp, confidence };
  }

  // Detect rock on gesture (index and pinky extended)
  detectRockOn(landmarks) {
    const indexExtended = this.isFingerExtended(landmarks, 'indexFinger');
    const pinkyExtended = this.isFingerExtended(landmarks, 'pinky');
    const middleBent = this.isFingerBent(landmarks, 'middleFinger');
    const ringBent = this.isFingerBent(landmarks, 'ringFinger');

    const isRockOn = indexExtended && pinkyExtended && middleBent && ringBent;
    const confidence = isRockOn ? 0.9 : 0.1;
    
    return { isRockOn, confidence };
  }

  // Detect OK sign (thumb and index forming circle, other fingers extended)
  detectOKSign(landmarks) {
    const pinch = this.detectPinch(landmarks);
    const middleExtended = this.isFingerExtended(landmarks, 'middleFinger');
    const ringExtended = this.isFingerExtended(landmarks, 'ringFinger');
    const pinkyExtended = this.isFingerExtended(landmarks, 'pinky');

    const isOK = pinch.isPinched && middleExtended && ringExtended && pinkyExtended;
    const confidence = isOK ? 0.9 : 0.1;
    
    return { isOK, confidence };
  }

  // Main gesture recognition function
  recognizeGesture(landmarks) {
    if (!landmarks || landmarks.length < 21) {
      return {
        gesture: GESTURE_TYPES.NO_HAND,
        confidence: 0,
        details: {}
      };
    }

    // Detect all gestures
    const pinch = this.detectPinch(landmarks);
    const openHand = this.detectOpenHand(landmarks);
    const closedFist = this.detectClosedFist(landmarks);
    const point = this.detectPoint(landmarks);
    const victory = this.detectVictory(landmarks);
    const thumbsUp = this.detectThumbsUp(landmarks);
    const rockOn = this.detectRockOn(landmarks);
    const okSign = this.detectOKSign(landmarks);

    // Determine the most likely gesture
    const gestures = [
      { type: GESTURE_TYPES.PINCH, confidence: pinch.confidence, details: pinch },
      { type: GESTURE_TYPES.OPEN_HAND, confidence: openHand.confidence, details: openHand },
      { type: GESTURE_TYPES.CLOSED_FIST, confidence: closedFist.confidence, details: closedFist },
      { type: GESTURE_TYPES.POINT, confidence: point.confidence, details: point },
      { type: GESTURE_TYPES.VICTORY, confidence: victory.confidence, details: victory },
      { type: GESTURE_TYPES.THUMBS_UP, confidence: thumbsUp.confidence, details: thumbsUp },
      { type: GESTURE_TYPES.ROCK_ON, confidence: rockOn.confidence, details: rockOn },
      { type: GESTURE_TYPES.OK_SIGN, confidence: okSign.confidence, details: okSign }
    ];

    // Sort by confidence and get the highest
    gestures.sort((a, b) => b.confidence - a.confidence);
    const bestGesture = gestures[0];

    // Apply temporal smoothing
    const smoothedConfidence = this.applySmoothing(bestGesture.confidence);
    
    // Update gesture history
    this.updateGestureHistory(bestGesture.type, smoothedConfidence);

    // Determine final gesture with stability check
    const finalGesture = this.getStableGesture();

    return {
      gesture: finalGesture.type,
      confidence: finalGesture.confidence,
      details: finalGesture.details,
      allGestures: gestures,
      handPosition: {
        x: landmarks[9][0], // Middle finger base
        y: landmarks[9][1]
      },
      fingerSpread: this.calculateFingerSpread(landmarks)
    };
  }

  // Apply temporal smoothing to reduce jitter
  applySmoothing(currentConfidence) {
    if (this.gestureConfidence === 0) {
      this.gestureConfidence = currentConfidence;
    } else {
      this.gestureConfidence = this.gestureSmoothing * this.gestureConfidence + 
                              (1 - this.gestureSmoothing) * currentConfidence;
    }
    return this.gestureConfidence;
  }

  // Update gesture history for stability
  updateGestureHistory(gestureType, confidence) {
    const now = Date.now();
    
    // Add current gesture to history
    this.gestureHistory.push({
      type: gestureType,
      confidence: confidence,
      timestamp: now
    });

    // Keep only recent history (last 10 frames)
    if (this.gestureHistory.length > 10) {
      this.gestureHistory.shift();
    }
  }

  // Get stable gesture from history
  getStableGesture() {
    if (this.gestureHistory.length < 3) {
      return { type: GESTURE_TYPES.NO_HAND, confidence: 0, details: {} };
    }

    // Get the most recent gestures
    const recentGestures = this.gestureHistory.slice(-3);
    const gestureCounts = {};
    
    recentGestures.forEach(g => {
      gestureCounts[g.type] = (gestureCounts[g.type] || 0) + 1;
    });

    // Find the most common gesture
    let mostCommonGesture = null;
    let maxCount = 0;
    
    Object.entries(gestureCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonGesture = type;
      }
    });

    // Calculate average confidence for the most common gesture
    const avgConfidence = recentGestures
      .filter(g => g.type === mostCommonGesture)
      .reduce((sum, g) => sum + g.confidence, 0) / maxCount;

    return {
      type: mostCommonGesture,
      confidence: avgConfidence,
      details: {}
    };
  }

  // Calculate finger spread for scaling
  calculateFingerSpread(landmarks) {
    const thumbBase = landmarks[2];
    const pinkyBase = landmarks[17];
    return this.calculateDistance(thumbBase, pinkyBase);
  }

  // Get gesture description for UI
  getGestureDescription(gestureType) {
    const descriptions = {
      [GESTURE_TYPES.OPEN_HAND]: 'Open Hand - Movement Mode',
      [GESTURE_TYPES.CLOSED_FIST]: 'Closed Fist - Grab Mode',
      [GESTURE_TYPES.PINCH]: 'Pinch - Resize Mode',
      [GESTURE_TYPES.POINT]: 'Point - Select Mode',
      [GESTURE_TYPES.VICTORY]: 'Victory - Special Action',
      [GESTURE_TYPES.THUMBS_UP]: 'Thumbs Up - Confirm',
      [GESTURE_TYPES.ROCK_ON]: 'Rock On - Special Action',
      [GESTURE_TYPES.OK_SIGN]: 'OK Sign - Special Action',
      [GESTURE_TYPES.NO_HAND]: 'No Hand Detected'
    };
    return descriptions[gestureType] || 'Unknown Gesture';
  }

  // Get gesture emoji for UI
  getGestureEmoji(gestureType) {
    const emojis = {
      [GESTURE_TYPES.OPEN_HAND]: '✋',
      [GESTURE_TYPES.CLOSED_FIST]: '✊',
      [GESTURE_TYPES.PINCH]: '🤏',
      [GESTURE_TYPES.POINT]: '👆',
      [GESTURE_TYPES.VICTORY]: '✌️',
      [GESTURE_TYPES.THUMBS_UP]: '👍',
      [GESTURE_TYPES.ROCK_ON]: '🤘',
      [GESTURE_TYPES.OK_SIGN]: '👌',
      [GESTURE_TYPES.NO_HAND]: '❌'
    };
    return emojis[gestureType] || '❓';
  }
}

export default GestureRecognition; 