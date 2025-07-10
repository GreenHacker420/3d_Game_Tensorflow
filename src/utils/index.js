import GestureRecognition, { GESTURE_TYPES } from './gestureRecognition';

const fingerJoints = {
  thumb: [0,1,2,3,4],
  indexFinger: [0,5,6,7,8],
  middleFinger: [0,9,10,11,12],
  ringFinger: [0,13,14,15,16],
  pinky: [0,17,18,19,20]
};

const fingers = [ 'thumb', 'indexFinger', 'middleFinger', 'ringFinger', 'pinky'];

// Initialize gesture recognition
const gestureRecognition = new GestureRecognition();

//maximum close hand distance between joints start to determine as close hand with 
//formula: abs(x1-x2) + abs(y1-y2)
const maxCloseHandDistance = 10;

export const drawHand = (predictions, ctx) => {
  let handState = {
    isPinched: false,
    position: { x: 0, y: 0 },
    fingerSpread: 0,
    isTracking: false,
    gesture: GESTURE_TYPES.NO_HAND,
    confidence: 0,
    gestureDetails: {},
    allGestures: []
  };

  if (predictions.length > 0) {
    const landmarks = predictions[0].landmarks;
    handState.isTracking = true;
    
    // Use advanced gesture recognition
    const gestureResult = gestureRecognition.recognizeGesture(landmarks);
    
    // Update hand state with gesture recognition results
    handState.gesture = gestureResult.gesture;
    handState.confidence = gestureResult.confidence;
    handState.gestureDetails = gestureResult.details;
    handState.allGestures = gestureResult.allGestures;
    handState.fingerSpread = gestureResult.fingerSpread;
    
    // Maintain backward compatibility
    handState.isPinched = gestureResult.gesture === GESTURE_TYPES.PINCH;
    handState.position = gestureResult.handPosition;
    
    // Draw hand points and connections with enhanced visualization
    drawHandLandmarks(landmarks, ctx, handState);
    
    // Draw gesture-specific visual feedback
    drawGestureFeedback(ctx, handState, landmarks);
  }

  return handState;
};

// Enhanced hand landmark drawing with gesture-based coloring
const drawHandLandmarks = (landmarks, ctx, handState) => {
  // Draw hand points with gesture-based colors
  for (let i = 0; i < landmarks.length; i++) {
    const x = landmarks[i][0];
    const y = landmarks[i][1];
    
    // Color points based on gesture
    let pointColor = '#00FF00'; // Default green
    let pointSize = 5;
    
    if (handState.gesture === GESTURE_TYPES.PINCH) {
      pointColor = '#FFAA00'; // Orange for pinch
      pointSize = 6;
    } else if (handState.gesture === GESTURE_TYPES.CLOSED_FIST) {
      pointColor = '#FF4444'; // Red for fist
      pointSize = 7;
    } else if (handState.gesture === GESTURE_TYPES.POINT) {
      pointColor = '#4444FF'; // Blue for point
      pointSize = 6;
    } else if (handState.gesture === GESTURE_TYPES.VICTORY) {
      pointColor = '#FF44FF'; // Magenta for victory
      pointSize = 6;
    }
    
    // Draw points with confidence-based opacity
    ctx.beginPath();
    ctx.arc(x, y, pointSize, 0, 3 * Math.PI);
    ctx.fillStyle = pointColor;
    ctx.globalAlpha = Math.max(0.3, handState.confidence);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  // Draw finger connections with gesture-based styling
  for (const finger of Object.keys(fingerJoints)) {
    const points = fingerJoints[finger];
    for (let i = 0; i < points.length - 1; i++) {
      const firstPoint = landmarks[points[i]];
      const secondPoint = landmarks[points[i + 1]];
      
      // Line color based on gesture
      let lineColor = '#00FF00';
      let lineWidth = 2;
      
      if (handState.gesture === GESTURE_TYPES.PINCH) {
        lineColor = '#FFAA00';
        lineWidth = 3;
      } else if (handState.gesture === GESTURE_TYPES.CLOSED_FIST) {
        lineColor = '#FF4444';
        lineWidth = 3;
      }
      
      // Draw lines
      ctx.beginPath();
      ctx.moveTo(firstPoint[0], firstPoint[1]);
      ctx.lineTo(secondPoint[0], secondPoint[1]);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = Math.max(0.5, handState.confidence);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
  }
};

// Draw gesture-specific visual feedback
const drawGestureFeedback = (ctx, handState, landmarks) => {
  if (!handState.isTracking) return;
  
  const canvas = ctx.canvas;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // Draw gesture indicator
  const gestureEmoji = gestureRecognition.getGestureEmoji(handState.gesture);
  const gestureText = gestureRecognition.getGestureDescription(handState.gesture);
  
  // Background for gesture indicator
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(10, 10, 200, 60);
  
  // Gesture emoji
  ctx.font = '24px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(gestureEmoji, 20, 35);
  
  // Gesture text
  ctx.font = '12px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(gestureText, 50, 30);
  
  // Confidence bar
  const confidenceWidth = 140 * handState.confidence;
  ctx.fillStyle = '#FFAA00';
  ctx.fillRect(50, 40, confidenceWidth, 8);
  ctx.strokeStyle = '#FFFFFF';
  ctx.strokeRect(50, 40, 140, 8);
  
  // Confidence percentage
  ctx.font = '10px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`${Math.round(handState.confidence * 100)}%`, 200, 48);
  
  // Draw confidence rings around hand center
  if (handState.confidence > 0.5) {
    const handCenterX = handState.position.x;
    const handCenterY = handState.position.y;
    
    ctx.beginPath();
    ctx.arc(handCenterX, handCenterY, 30, 0, 2 * Math.PI);
    ctx.strokeStyle = `rgba(0, 255, 0, ${handState.confidence * 0.5})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(handCenterX, handCenterY, 50, 0, 2 * Math.PI);
    ctx.strokeStyle = `rgba(0, 255, 0, ${handState.confidence * 0.3})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  // Draw gesture-specific effects
  if (handState.gesture === GESTURE_TYPES.PINCH) {
    // Draw pinch indicator
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    
    ctx.beginPath();
    ctx.moveTo(thumbTip[0], thumbTip[1]);
    ctx.lineTo(indexTip[0], indexTip[1]);
    ctx.strokeStyle = '#FFAA00';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  
  // Draw all detected gestures for debugging
  if (handState.allGestures && handState.allGestures.length > 0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 80, 300, 120);
    
    ctx.font = '10px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('All Detected Gestures:', 15, 95);
    
    handState.allGestures.slice(0, 5).forEach((gesture, index) => {
      const emoji = gestureRecognition.getGestureEmoji(gesture.type);
      const confidence = Math.round(gesture.confidence * 100);
      ctx.fillText(`${emoji} ${gesture.type}: ${confidence}%`, 15, 110 + (index * 15));
    });
  }
};

// Export gesture recognition for external use
export { GestureRecognition, GESTURE_TYPES };
