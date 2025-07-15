import {
  UniversalCamera,
  Vector3
} from "@babylonjs/core";

/**
 * Manages camera setup and controls for the 3D scene
 */
export class CameraController {
  constructor(scene) {
    this.scene = scene;
    this.camera = null;
    this.isInitialized = false;
    
    // Camera settings
    this.defaultPosition = new Vector3(-90, -10, -10);
    this.defaultTarget = Vector3.Zero();
    this.defaultRotation = new Vector3(-3, 0, 0);
  }

  /**
   * Initialize the camera
   * @param {HTMLCanvasElement} canvas - Canvas element for camera controls
   * @returns {UniversalCamera} Initialized camera
   */
  initialize(canvas) {
    if (this.isInitialized) {
      return this.camera;
    }

    try {
      // Create universal camera
      this.camera = new UniversalCamera(
        "MainCamera", 
        this.defaultPosition.clone(), 
        this.scene
      );

      // Set camera rotation
      this.camera.rotation = this.defaultRotation.clone();

      // Set camera target
      this.camera.setTarget(this.defaultTarget.clone());

      // Attach camera controls to canvas
      if (canvas) {
        this.camera.attachControl(canvas, true);
        this.setupKeyboardControls();
      }

      // Set as active camera
      this.scene.activeCamera = this.camera;

      this.isInitialized = true;
      console.log('✅ Camera initialized successfully');

      return this.camera;

    } catch (error) {
      console.error('❌ Failed to initialize camera:', error);
      throw error;
    }
  }

  /**
   * Setup keyboard controls for camera movement
   */
  setupKeyboardControls() {
    if (!this.camera) return;

    // WASD controls
    this.camera.keysUp = [87];    // W key
    this.camera.keysDown = [83];  // S key
    this.camera.keysLeft = [65];  // A key
    this.camera.keysRight = [68]; // D key

    // Movement speed
    this.camera.speed = 2;
    this.camera.angularSensibility = 2000;
  }

  /**
   * Set camera position
   * @param {Vector3} position - New camera position
   */
  setPosition(position) {
    if (this.camera) {
      this.camera.position = position.clone();
    }
  }

  /**
   * Set camera target
   * @param {Vector3} target - New camera target
   */
  setTarget(target) {
    if (this.camera) {
      this.camera.setTarget(target.clone());
    }
  }

  /**
   * Set camera rotation
   * @param {Vector3} rotation - New camera rotation
   */
  setRotation(rotation) {
    if (this.camera) {
      this.camera.rotation = rotation.clone();
    }
  }

  /**
   * Reset camera to default position
   */
  resetToDefault() {
    if (!this.camera) return;

    this.camera.position = this.defaultPosition.clone();
    this.camera.rotation = this.defaultRotation.clone();
    this.camera.setTarget(this.defaultTarget.clone());
  }

  /**
   * Focus camera on a specific target
   * @param {Vector3} target - Target position to focus on
   * @param {number} distance - Distance from target (optional)
   */
  focusOnTarget(target, distance = 50) {
    if (!this.camera) return;

    // Calculate camera position based on target and distance
    const direction = this.camera.position.subtract(target).normalize();
    const newPosition = target.add(direction.scale(distance));
    
    this.camera.position = newPosition;
    this.camera.setTarget(target);
  }

  /**
   * Smoothly move camera to new position
   * @param {Vector3} targetPosition - Target position
   * @param {Vector3} targetRotation - Target rotation (optional)
   * @param {number} duration - Animation duration in ms
   */
  animateToPosition(targetPosition, targetRotation = null, duration = 1000) {
    if (!this.camera) return;

    const startPosition = this.camera.position.clone();
    const startRotation = this.camera.rotation.clone();
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing function
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      // Interpolate position
      this.camera.position = Vector3.Lerp(startPosition, targetPosition, easeProgress);

      // Interpolate rotation if provided
      if (targetRotation) {
        this.camera.rotation = Vector3.Lerp(startRotation, targetRotation, easeProgress);
      }

      // Continue animation if not complete
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Get current camera position
   * @returns {Vector3} Current position
   */
  getPosition() {
    return this.camera ? this.camera.position.clone() : Vector3.Zero();
  }

  /**
   * Get current camera rotation
   * @returns {Vector3} Current rotation
   */
  getRotation() {
    return this.camera ? this.camera.rotation.clone() : Vector3.Zero();
  }

  /**
   * Get current camera target
   * @returns {Vector3} Current target
   */
  getTarget() {
    if (!this.camera) return Vector3.Zero();
    
    // Calculate target based on camera position and rotation
    const forward = this.camera.getForwardRay().direction;
    return this.camera.position.add(forward.scale(10));
  }

  /**
   * Enable/disable camera controls
   * @param {boolean} enabled - Whether to enable controls
   */
  setControlsEnabled(enabled) {
    if (!this.camera) return;

    if (enabled) {
      this.camera.attachControl(this.scene.getEngine().getRenderingCanvas(), true);
    } else {
      this.camera.detachControl();
    }
  }

  /**
   * Get the camera instance
   * @returns {UniversalCamera|null} Camera instance
   */
  getCamera() {
    return this.camera;
  }

  /**
   * Dispose camera resources
   */
  dispose() {
    if (this.camera) {
      this.camera.dispose();
      this.camera = null;
    }
    
    this.isInitialized = false;
    console.log('🗑️ CameraController disposed');
  }
}

export default CameraController;
