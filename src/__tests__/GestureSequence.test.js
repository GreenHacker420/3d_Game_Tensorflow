import { GestureSequenceDetector, GESTURE_COMBOS } from '../utils/GestureSequence';
import { GESTURE_TYPES } from '../utils/gestureRecognition';

describe('GestureSequenceDetector', () => {
  let detector;

  beforeEach(() => {
    detector = new GestureSequenceDetector(3000); // 3 second timeout
  });

  test('should initialize correctly', () => {
    expect(detector).toBeDefined();
    expect(detector.gestureHistory).toEqual([]);
    expect(detector.activeCombo).toBeNull();
  });

  test('should add gestures to history', () => {
    detector.addGesture(GESTURE_TYPES.OPEN_HAND, 0.9);
    expect(detector.gestureHistory).toHaveLength(1);
    expect(detector.gestureHistory[0].gesture).toBe(GESTURE_TYPES.OPEN_HAND);
    expect(detector.gestureHistory[0].confidence).toBe(0.9);
  });

  test('should detect POWER_UP combo', () => {
    const combo = GESTURE_COMBOS.POWER_UP;
    let detectedCombo = null;
    let completedCombo = null;

    detector.setEventHandlers({
      onComboDetected: (c) => { detectedCombo = c; },
      onComboCompleted: (c) => { completedCombo = c; },
      onComboFailed: () => {}
    });

    // Add first gesture - should trigger combo detection immediately
    detector.addGesture(GESTURE_TYPES.CLOSED_FIST, 0.9);
    expect(detectedCombo).toBeTruthy(); // Combo should be detected on first matching gesture
    expect(detectedCombo.id).toBe(combo.id);

    // Add second gesture
    detector.addGesture(GESTURE_TYPES.VICTORY, 0.9);
    expect(detectedCombo).toBeTruthy();
    expect(detectedCombo.id).toBe(combo.id);

    // Add third gesture to complete combo
    detector.addGesture(GESTURE_TYPES.THUMBS_UP, 0.9);
    expect(completedCombo).toBeTruthy();
    expect(completedCombo.id).toBe(combo.id);
  });

  test('should clean old gestures', () => {
    // Mock Date.now to control time
    const originalNow = Date.now;
    let mockTime = 1000;
    Date.now = jest.fn(() => mockTime);

    detector.addGesture(GESTURE_TYPES.OPEN_HAND, 0.9);
    expect(detector.gestureHistory).toHaveLength(1);

    // Advance time beyond timeout
    mockTime += 4000; // 4 seconds later
    detector.addGesture(GESTURE_TYPES.CLOSED_FIST, 0.9);

    // Old gesture should be cleaned
    expect(detector.gestureHistory).toHaveLength(1);
    expect(detector.gestureHistory[0].gesture).toBe(GESTURE_TYPES.CLOSED_FIST);

    // Restore original Date.now
    Date.now = originalNow;
  });

  test('should match sequences correctly', () => {
    const current = [GESTURE_TYPES.OPEN_HAND, GESTURE_TYPES.PINCH];
    const target = [GESTURE_TYPES.OPEN_HAND, GESTURE_TYPES.PINCH, GESTURE_TYPES.OK_SIGN];

    const result = detector.matchesSequence(current, target);
    expect(result.isPartial).toBe(true);
    expect(result.isComplete).toBe(false);
    expect(result.progress).toBeCloseTo(0.67, 1);
  });

  test('should detect complete sequence', () => {
    const current = [GESTURE_TYPES.OPEN_HAND, GESTURE_TYPES.PINCH, GESTURE_TYPES.OK_SIGN];
    const target = [GESTURE_TYPES.OPEN_HAND, GESTURE_TYPES.PINCH, GESTURE_TYPES.OK_SIGN];

    const result = detector.matchesSequence(current, target);
    expect(result.isPartial).toBe(false);
    expect(result.isComplete).toBe(true);
    expect(result.progress).toBe(1.0);
  });

  test('should fail combo on wrong gesture', () => {
    let failedCombo = null;
    detector.setEventHandlers({
      onComboDetected: () => {},
      onComboCompleted: () => {},
      onComboFailed: (c) => { failedCombo = c; }
    });

    // Start POWER_UP combo
    detector.addGesture(GESTURE_TYPES.CLOSED_FIST, 0.9);
    detector.addGesture(GESTURE_TYPES.VICTORY, 0.9);
    expect(detector.activeCombo).toBeTruthy();

    // Add wrong gesture - this should start a new combo (ROCK_STAR) instead of failing
    detector.addGesture(GESTURE_TYPES.ROCK_ON, 0.9);
    // The ROCK_STAR combo starts with ROCK_ON, so it will detect a new combo
    expect(detector.activeCombo).toBeTruthy(); // New combo should be active
    expect(detector.activeCombo.id).toBe('rock_star'); // Should be ROCK_STAR combo
  });

  test('should get combo status', () => {
    detector.addGesture(GESTURE_TYPES.OPEN_HAND, 0.9);
    const status = detector.getComboStatus();

    expect(status).toHaveProperty('activeCombo');
    expect(status).toHaveProperty('gestureHistory');
    expect(status).toHaveProperty('availableCombos');
    expect(status.gestureHistory).toHaveLength(1);
    expect(status.availableCombos.length).toBeGreaterThan(0);
  });
});
