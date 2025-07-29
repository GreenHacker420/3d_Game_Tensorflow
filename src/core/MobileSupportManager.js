/**
 * Mobile Support Manager
 * Handles mobile device detection, touch gestures, and responsive adaptations
 */

export class MobileSupportManager {
  constructor(options = {}) {
    this.config = {
      enableTouchGestures: options.enableTouchGestures !== false,
      enableOrientationSupport: options.enableOrientationSupport !== false,
      enableHapticFeedback: options.enableHapticFeedback !== false,
      touchSensitivity: options.touchSensitivity || 1.0,
      ...options
    };

    // Device detection
    this.deviceInfo = {
      isMobile: false,
      isTablet: false,
      isTouch: false,
      orientation: 'portrait',
      screenSize: { width: 0, height: 0 },
      pixelRatio: 1,
      hasGyroscope: false,
      hasAccelerometer: false
    };

    // Touch gesture state
    this.touchState = {
      isActive: false,
      touches: new Map(),
      lastGesture: null,
      gestureStartTime: 0,
      gestureHistory: []
    };

    // Orientation state
    this.orientationState = {
      alpha: 0, // Z-axis rotation
      beta: 0,  // X-axis rotation
      gamma: 0, // Y-axis rotation
      isSupported: false,
      isCalibrated: false,
      calibrationOffset: { alpha: 0, beta: 0, gamma: 0 }
    };

    // Event listeners
    this.eventListeners = new Map();

    // Callbacks
    this.onTouchGesture = null;
    this.onOrientationChange = null;
    this.onDeviceMotion = null;

    console.log('📱 MobileSupportManager initialized');
  }

  /**
   * Initialize mobile support
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      // Detect device capabilities
      this.detectDevice();

      // Set up touch gesture support
      if (this.config.enableTouchGestures && this.deviceInfo.isTouch) {
        this.initializeTouchGestures();
      }

      // Set up orientation support
      if (this.config.enableOrientationSupport && this.deviceInfo.isMobile) {
        await this.initializeOrientationSupport();
      }

      // Set up responsive design
      this.initializeResponsiveDesign();

      console.log('✅ Mobile support initialized');
      console.log('📊 Device info:', this.deviceInfo);

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize mobile support:', error);
      return false;
    }
  }

  /**
   * Detect device type and capabilities
   */
  detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    // Mobile detection
    this.deviceInfo.isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    // Tablet detection
    this.deviceInfo.isTablet = /ipad|android(?!.*mobile)/i.test(userAgent) || 
                              (screenWidth >= 768 && screenHeight >= 1024);

    // Touch support
    this.deviceInfo.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Screen info
    this.deviceInfo.screenSize = {
      width: screenWidth,
      height: screenHeight
    };
    this.deviceInfo.pixelRatio = window.devicePixelRatio || 1;

    // Orientation
    this.deviceInfo.orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';

    // Sensor support
    this.deviceInfo.hasGyroscope = 'DeviceOrientationEvent' in window;
    this.deviceInfo.hasAccelerometer = 'DeviceMotionEvent' in window;

    console.log('📱 Device detected:', this.deviceInfo);
  }

  /**
   * Initialize touch gesture support
   */
  initializeTouchGestures() {
    const canvas = document.querySelector('canvas'); // Main game canvas
    if (!canvas) {
      console.warn('⚠️ Canvas not found for touch gestures');
      return;
    }

    // Touch start
    const handleTouchStart = (event) => {
      event.preventDefault();
      this.handleTouchStart(event);
    };

    // Touch move
    const handleTouchMove = (event) => {
      event.preventDefault();
      this.handleTouchMove(event);
    };

    // Touch end
    const handleTouchEnd = (event) => {
      event.preventDefault();
      this.handleTouchEnd(event);
    };

    // Add event listeners
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Store listeners for cleanup
    this.eventListeners.set('touchstart', handleTouchStart);
    this.eventListeners.set('touchmove', handleTouchMove);
    this.eventListeners.set('touchend', handleTouchEnd);

    console.log('👆 Touch gesture support initialized');
  }

  /**
   * Initialize device orientation support
   * @returns {Promise<boolean>} Success status
   */
  async initializeOrientationSupport() {
    if (!this.deviceInfo.hasGyroscope) {
      console.log('📱 Device orientation not supported');
      return false;
    }

    try {
      // Request permission for iOS 13+
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') {
          console.log('📱 Device orientation permission denied');
          return false;
        }
      }

      // Add orientation event listener
      const handleOrientation = (event) => {
        this.handleOrientationChange(event);
      };

      window.addEventListener('deviceorientation', handleOrientation);
      this.eventListeners.set('deviceorientation', handleOrientation);

      // Add motion event listener if available
      if (this.deviceInfo.hasAccelerometer) {
        const handleMotion = (event) => {
          this.handleDeviceMotion(event);
        };

        window.addEventListener('devicemotion', handleMotion);
        this.eventListeners.set('devicemotion', handleMotion);
      }

      this.orientationState.isSupported = true;
      console.log('🧭 Device orientation support initialized');

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize orientation support:', error);
      return false;
    }
  }

  /**
   * Initialize responsive design adaptations
   */
  initializeResponsiveDesign() {
    // Handle viewport changes
    const handleResize = () => {
      this.handleViewportChange();
    };

    // Handle orientation changes
    const handleOrientationChange = () => {
      setTimeout(() => {
        this.handleViewportChange();
      }, 100); // Delay to ensure dimensions are updated
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    this.eventListeners.set('resize', handleResize);
    this.eventListeners.set('orientationchange', handleOrientationChange);

    // Initial setup
    this.handleViewportChange();

    console.log('📐 Responsive design initialized');
  }

  /**
   * Handle touch start event
   * @param {TouchEvent} event - Touch event
   */
  handleTouchStart(event) {
    this.touchState.isActive = true;
    this.touchState.gestureStartTime = Date.now();

    // Store touch points
    for (const touch of event.touches) {
      this.touchState.touches.set(touch.identifier, {
        id: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        startTime: Date.now()
      });
    }

    // Detect gesture type
    const gestureType = this.detectGestureType(event);
    this.touchState.lastGesture = gestureType;

    // Trigger haptic feedback
    if (this.config.enableHapticFeedback) {
      this.triggerHapticFeedback('light');
    }

    // Notify callback
    if (this.onTouchGesture) {
      this.onTouchGesture({
        type: 'start',
        gesture: gestureType,
        touches: Array.from(this.touchState.touches.values()),
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle touch move event
   * @param {TouchEvent} event - Touch event
   */
  handleTouchMove(event) {
    if (!this.touchState.isActive) return;

    // Update touch positions
    for (const touch of event.touches) {
      const storedTouch = this.touchState.touches.get(touch.identifier);
      if (storedTouch) {
        storedTouch.currentX = touch.clientX;
        storedTouch.currentY = touch.clientY;
      }
    }

    // Detect gesture updates
    const gestureType = this.detectGestureType(event);
    
    // Notify callback
    if (this.onTouchGesture) {
      this.onTouchGesture({
        type: 'move',
        gesture: gestureType,
        touches: Array.from(this.touchState.touches.values()),
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle touch end event
   * @param {TouchEvent} event - Touch event
   */
  handleTouchEnd(event) {
    // Remove ended touches
    for (const touch of event.changedTouches) {
      this.touchState.touches.delete(touch.identifier);
    }

    // Check if all touches ended
    if (this.touchState.touches.size === 0) {
      this.touchState.isActive = false;
      
      // Store gesture in history
      const gestureDuration = Date.now() - this.touchState.gestureStartTime;
      this.touchState.gestureHistory.push({
        gesture: this.touchState.lastGesture,
        duration: gestureDuration,
        timestamp: Date.now()
      });

      // Keep history size manageable
      if (this.touchState.gestureHistory.length > 10) {
        this.touchState.gestureHistory.shift();
      }
    }

    // Notify callback
    if (this.onTouchGesture) {
      this.onTouchGesture({
        type: 'end',
        gesture: this.touchState.lastGesture,
        touches: Array.from(this.touchState.touches.values()),
        timestamp: Date.now()
      });
    }
  }

  /**
   * Detect gesture type from touch event
   * @param {TouchEvent} event - Touch event
   * @returns {string} Gesture type
   */
  detectGestureType(event) {
    const touchCount = event.touches.length;

    if (touchCount === 1) {
      return 'tap';
    } else if (touchCount === 2) {
      const touches = Array.from(event.touches);
      const distance = this.calculateDistance(touches[0], touches[1]);
      
      // Check if it's a pinch gesture
      if (this.touchState.touches.size === 2) {
        const storedTouches = Array.from(this.touchState.touches.values());
        const initialDistance = this.calculateDistance(
          { clientX: storedTouches[0].startX, clientY: storedTouches[0].startY },
          { clientX: storedTouches[1].startX, clientY: storedTouches[1].startY }
        );
        
        if (Math.abs(distance - initialDistance) > 20) {
          return distance > initialDistance ? 'pinch_out' : 'pinch_in';
        }
      }
      
      return 'two_finger_tap';
    } else if (touchCount >= 3) {
      return 'multi_touch';
    }

    return 'unknown';
  }

  /**
   * Calculate distance between two touch points
   * @param {Touch} touch1 - First touch point
   * @param {Touch} touch2 - Second touch point
   * @returns {number} Distance in pixels
   */
  calculateDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Handle device orientation change
   * @param {DeviceOrientationEvent} event - Orientation event
   */
  handleOrientationChange(event) {
    // Apply calibration offset
    this.orientationState.alpha = (event.alpha || 0) - this.orientationState.calibrationOffset.alpha;
    this.orientationState.beta = (event.beta || 0) - this.orientationState.calibrationOffset.beta;
    this.orientationState.gamma = (event.gamma || 0) - this.orientationState.calibrationOffset.gamma;

    // Notify callback
    if (this.onOrientationChange) {
      this.onOrientationChange({
        alpha: this.orientationState.alpha,
        beta: this.orientationState.beta,
        gamma: this.orientationState.gamma,
        absolute: event.absolute,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle device motion event
   * @param {DeviceMotionEvent} event - Motion event
   */
  handleDeviceMotion(event) {
    if (this.onDeviceMotion) {
      this.onDeviceMotion({
        acceleration: event.acceleration,
        accelerationIncludingGravity: event.accelerationIncludingGravity,
        rotationRate: event.rotationRate,
        interval: event.interval,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle viewport changes
   */
  handleViewportChange() {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    const newOrientation = newWidth > newHeight ? 'landscape' : 'portrait';

    // Update device info
    this.deviceInfo.screenSize.width = newWidth;
    this.deviceInfo.screenSize.height = newHeight;
    this.deviceInfo.orientation = newOrientation;

    console.log('📐 Viewport changed:', this.deviceInfo.screenSize, newOrientation);

    // Trigger responsive adaptations
    this.applyResponsiveAdaptations();
  }

  /**
   * Apply responsive design adaptations
   */
  applyResponsiveAdaptations() {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    // Adjust canvas size for mobile
    if (this.deviceInfo.isMobile) {
      const container = canvas.parentElement;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.maxWidth = `${containerRect.width}px`;
        canvas.style.maxHeight = `${containerRect.height}px`;
      }
    }

    // Adjust UI elements based on orientation
    const uiElements = document.querySelectorAll('.mobile-adaptive');
    uiElements.forEach(element => {
      if (this.deviceInfo.orientation === 'landscape') {
        element.classList.add('landscape-mode');
        element.classList.remove('portrait-mode');
      } else {
        element.classList.add('portrait-mode');
        element.classList.remove('landscape-mode');
      }
    });
  }

  /**
   * Calibrate device orientation
   */
  calibrateOrientation() {
    if (!this.orientationState.isSupported) {
      console.warn('⚠️ Device orientation not supported');
      return false;
    }

    // Store current orientation as calibration offset
    this.orientationState.calibrationOffset = {
      alpha: this.orientationState.alpha,
      beta: this.orientationState.beta,
      gamma: this.orientationState.gamma
    };

    this.orientationState.isCalibrated = true;
    console.log('🧭 Device orientation calibrated');

    return true;
  }

  /**
   * Trigger haptic feedback
   * @param {string} type - Feedback type ('light', 'medium', 'heavy')
   */
  triggerHapticFeedback(type = 'light') {
    if (!this.config.enableHapticFeedback || !navigator.vibrate) {
      return;
    }

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [50, 50, 50]
    };

    const pattern = patterns[type] || patterns.light;
    navigator.vibrate(pattern);
  }

  /**
   * Get current device and touch state
   * @returns {Object} Current state
   */
  getCurrentState() {
    return {
      deviceInfo: { ...this.deviceInfo },
      touchState: {
        isActive: this.touchState.isActive,
        touchCount: this.touchState.touches.size,
        lastGesture: this.touchState.lastGesture
      },
      orientationState: { ...this.orientationState }
    };
  }

  /**
   * Dispose mobile support manager
   */
  dispose() {
    // Remove all event listeners
    for (const [eventType, listener] of this.eventListeners) {
      if (eventType.startsWith('touch')) {
        const canvas = document.querySelector('canvas');
        if (canvas) {
          canvas.removeEventListener(eventType, listener);
        }
      } else {
        window.removeEventListener(eventType, listener);
      }
    }

    this.eventListeners.clear();
    this.touchState.touches.clear();

    console.log('🔄 MobileSupportManager disposed');
  }
}

export default MobileSupportManager;
