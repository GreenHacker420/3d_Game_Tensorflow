import GestureRecognition, { GESTURE_TYPES } from './gestureRecognition';

// Sample hand landmarks for testing different gestures
const createTestLandmarks = (gestureType) => {
  // Base landmarks structure (21 points)
  const landmarks = Array(21).fill().map(() => [0, 0, 0]);
  
  switch (gestureType) {
    case 'open_hand':
      // Open hand - all fingers extended
      landmarks[4] = [100, 50, 0];  // Thumb tip
      landmarks[8] = [150, 50, 0];  // Index tip
      landmarks[12] = [200, 50, 0]; // Middle tip
      landmarks[16] = [250, 50, 0]; // Ring tip
      landmarks[20] = [300, 50, 0]; // Pinky tip
      break;
      
    case 'pinch':
      // Pinch - thumb and index close
      landmarks[4] = [100, 50, 0];  // Thumb tip
      landmarks[8] = [105, 50, 0];  // Index tip (close to thumb)
      landmarks[12] = [200, 50, 0]; // Middle tip
      landmarks[16] = [250, 50, 0]; // Ring tip
      landmarks[20] = [300, 50, 0]; // Pinky tip
      break;
      
    case 'closed_fist':
      // Closed fist - all fingers bent
      landmarks[4] = [50, 50, 0];   // Thumb tip
      landmarks[8] = [60, 50, 0];   // Index tip
      landmarks[12] = [70, 50, 0];  // Middle tip
      landmarks[16] = [80, 50, 0];  // Ring tip
      landmarks[20] = [90, 50, 0];  // Pinky tip
      break;
      
    case 'point':
      // Point - only index extended
      landmarks[4] = [50, 50, 0];   // Thumb tip
      landmarks[8] = [150, 50, 0];  // Index tip (extended)
      landmarks[12] = [60, 50, 0];  // Middle tip (bent)
      landmarks[16] = [70, 50, 0];  // Ring tip (bent)
      landmarks[20] = [80, 50, 0];  // Pinky tip (bent)
      break;
      
    case 'victory':
      // Victory - index and middle extended
      landmarks[4] = [50, 50, 0];   // Thumb tip
      landmarks[8] = [150, 50, 0];  // Index tip (extended)
      landmarks[12] = [200, 50, 0]; // Middle tip (extended)
      landmarks[16] = [60, 50, 0];  // Ring tip (bent)
      landmarks[20] = [70, 50, 0];  // Pinky tip (bent)
      break;
      
    default:
      // Default open hand
      landmarks[4] = [100, 50, 0];
      landmarks[8] = [150, 50, 0];
      landmarks[12] = [200, 50, 0];
      landmarks[16] = [250, 50, 0];
      landmarks[20] = [300, 50, 0];
  }
  
  return landmarks;
};

// Test the gesture recognition system
export const testGestureRecognition = () => {
  const gestureRecognition = new GestureRecognition();
  const testGestures = ['open_hand', 'pinch', 'closed_fist', 'point', 'victory'];
  
  console.log('🧪 Testing Gesture Recognition System...');
  
  testGestures.forEach(gestureType => {
    const landmarks = createTestLandmarks(gestureType);
    const result = gestureRecognition.recognizeGesture(landmarks);
    
    console.log(`\n📝 Testing ${gestureType}:`);
    console.log(`   Detected: ${result.gesture}`);
    console.log(`   Confidence: ${Math.round(result.confidence * 100)}%`);
    console.log(`   Position: (${result.handPosition.x}, ${result.handPosition.y})`);
    console.log(`   Finger Spread: ${Math.round(result.fingerSpread)}`);
  });
  
  console.log('\n✅ Gesture recognition test completed!');
};

// Export for use in development
export default testGestureRecognition; 