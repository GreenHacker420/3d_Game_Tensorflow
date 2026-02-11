import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  Animation
} from "@babylonjs/core";
import { GESTURE_TYPES } from '../core/GestureClassifier.js';
import { CyberMaterial } from '../3d/materials/CyberMaterial.js';

/**
 * CyberObject: Interactive 3D object for Cyberpunk theme
 */
export class CyberObject {
  constructor(scene, name = "CyberObject") {
    this.scene = scene;
    this.name = name;
    this.mesh = null;
    this.material = null;
    this.isInitialized = false;

    // Interaction state
    this.isSelected = false;
    this.isGrabbed = false;
    this.lastHandPosition = null;

    // Movement properties
    this.smoothingFactor = 0.15;
    this.boundarySize = { width: 80, height: 60, depth: 40 };

    // Scale properties
    this.minScale = 0.5;
    this.maxScale = 3.0;
    this.initialScale = 1.0;
    this.scaleSpeed = 0.02;

    // Rotation properties
    this.rotationSpeed = 0.05;
    this.autoRotation = false;
    this.handOrientationRotation = true;
    this.lastHandOrientation = null;
    this.rotationSmoothing = 0.1;

    // Physics properties
    this.enablePhysics = true;
    this.velocity = Vector3.Zero();
    this.gravity = new Vector3(0, -0.01, 0);
    this.friction = 0.98;
    this.bounce = 0.7;
    this.momentum = Vector3.Zero();

    // Animation properties
    this.animations = new Map();

    // supported gestures
    this.supportedGestures = [];
  }

  /**
   * Get supported gestures based on type
   */
  getSupportedGestures() {
    // Each object type supports different gestures
    const gestureMap = {
      'cube': [
        GESTURE_TYPES.OPEN_HAND,
        GESTURE_TYPES.CLOSED_FIST,
        GESTURE_TYPES.PINCH,
        GESTURE_TYPES.POINT,
        GESTURE_TYPES.OK_SIGN
      ],
      'sphere': [
        GESTURE_TYPES.CLOSED_FIST,
        GESTURE_TYPES.POINT,
        GESTURE_TYPES.VICTORY,
        GESTURE_TYPES.THUMBS_UP,
        GESTURE_TYPES.ROCK_ON
      ],
      'pyramid': [
        GESTURE_TYPES.THUMBS_UP,
        GESTURE_TYPES.ROCK_ON,
        GESTURE_TYPES.OK_SIGN,
        GESTURE_TYPES.VICTORY,
        GESTURE_TYPES.PINCH
      ],
      'cylinder': [
        GESTURE_TYPES.PINCH,
        GESTURE_TYPES.OPEN_HAND,
        GESTURE_TYPES.VICTORY,
        GESTURE_TYPES.POINT,
        GESTURE_TYPES.CLOSED_FIST
      ]
    };

    return gestureMap[this.type] || [
      GESTURE_TYPES.OPEN_HAND,
      GESTURE_TYPES.CLOSED_FIST,
      GESTURE_TYPES.PINCH
    ];
  }

  /**
   * Check if object can handle gesture
   * @param {string} gesture - Gesture to check
   * @returns {boolean} True if supported
   */
  canHandleGesture(gesture) {
    return this.supportedGestures.includes(gesture);
  }

  /**
   * Initialize the cyber object
   * @param {Vector3} position - Initial position
   * @param {number} size - Initial size
   * @param {string} type - Object type (cube, sphere, cylinder, pyramid)
   * @param {Color3} color - Object color
   * @returns {Mesh} Created mesh
   */
  initialize(position = Vector3.Zero(), size = 5, type = 'cube', color = Color3.FromHexString("#FF7F50")) {
    if (this.isInitialized) {
      return this.mesh;
    }

    try {
      this.type = type;
      this.baseColor = color;
      this.supportedGestures = this.getSupportedGestures();

      // Create mesh based on type
      switch (type) {
        case 'sphere':
          this.mesh = MeshBuilder.CreateSphere(this.name, { diameter: size }, this.scene);
          break;
        case 'cylinder':
          this.mesh = MeshBuilder.CreateCylinder(this.name, { diameter: size, height: size * 1.5 }, this.scene);
          break;
        case 'pyramid':
          this.mesh = MeshBuilder.CreateCylinder(this.name, { diameterTop: 0, diameterBottom: size, height: size, tessellation: 4 }, this.scene);
          break;
        case 'cube':
        default:
          this.mesh = MeshBuilder.CreateBox(this.name, { size }, this.scene);
          break;
      }

      this.mesh.position = position.clone();

      // Create material
      this.createMaterial();

      // Setup animations
      this.setupAnimations();

      this.isInitialized = true;
      console.log(`✅ CyberObject '${this.name}' (${this.type}) initialized`);

      return this.mesh;

    } catch (error) {
      console.error(`❌ Failed to initialize object '${this.name}':`, error);
      throw error;
    }
  }

  /**
   * Create material with interactive colors
   */
  createMaterial() {
    // Initial Cyber Material
    this.material = CyberMaterial.CreateNeon(
      `${this.name}_Material`,
      this.scene,
      this.baseColor || Color3.FromHexString("#FF7F50"),
      1.0
    );
    this.mesh.material = this.material;
  }

  setNormalAppearance() {
    if (this.material) {
      this.material.emissiveColor = this.baseColor || Color3.FromHexString("#FF7F50");
      this.material.emissiveIntensity = 1.0;
    }
  }

  /**
   * Set grabbed appearance
   */
  setGrabbedAppearance() {
    if (this.material) {
      this.material.emissiveColor = Color3.FromHexString("#FF0000"); // Intense Red
      this.material.emissiveIntensity = 2.0;
    }
  }

  /**
   * Set pinch appearance
   */
  setPinchAppearance() {
    if (this.material) {
      this.material.emissiveColor = Color3.FromHexString("#FFFF00"); // Bright Yellow
      this.material.emissiveIntensity = 1.5;
    }
  }

  /**
   * Setup animations for visual feedback
   */
  setupAnimations() {
    // Hover animation
    const hoverAnimation = Animation.CreateAndStartAnimation(
      "hoverAnimation",
      this.mesh,
      "position.y",
      30,
      120,
      this.mesh.position.y,
      this.mesh.position.y + 2,
      Animation.ANIMATIONLOOPMODE_YOYO
    );

    this.animations.set('hover', hoverAnimation);
    hoverAnimation.pause(); // Start paused
  }

  /**
   * Handle hand gesture interaction
   * @param {string} gesture - Gesture type
   * @param {Object} handState - Hand state data
   * @param {boolean} use3DMode - Whether to use 3D motion mode
   * @returns {boolean} True if gesture was handled
   */
  /**
   * Update object state (called every frame)
   */
  update() {
    if (!this.isInitialized) return;

    // Update physics simulation
    this.updatePhysics();
  }

  handleGesture(gesture, handState, use3DMode = false) {
    if (!this.isInitialized || !handState.isTracking) {
      return false;
    }

    if (!this.canHandleGesture(gesture)) {
      return false;
    }

    // Physics updated in update() loop now

    // Update rotation with hand orientation (only if not using 3D mode's built-in rotation)
    if (!use3DMode) {
      this.updateRotationWithHandOrientation(handState);
    }

    switch (gesture) {
      case GESTURE_TYPES.OPEN_HAND:
        return this.handleOpenHand(handState, use3DMode);

      case GESTURE_TYPES.CLOSED_FIST:
        return this.handleClosedFist(handState, use3DMode);

      case GESTURE_TYPES.PINCH:
        return this.handlePinch(handState, use3DMode);

      case GESTURE_TYPES.VICTORY:
        return this.handleVictory(handState, use3DMode);

      case GESTURE_TYPES.THUMBS_UP:
        return this.handleThumbsUp(handState, use3DMode);

      case GESTURE_TYPES.ROCK_ON:
        return this.handleRockOn(handState, use3DMode);

      case GESTURE_TYPES.POINT:
        return this.handlePoint(handState, use3DMode);

      case GESTURE_TYPES.OK_SIGN:
        return this.handleOKSign(handState, use3DMode);

      default:
        return this.handleDefault(handState);
    }
  }

  /**
   * Handle open hand gesture (movement)
   * @param {Object} handState - Hand state data
   * @param {boolean} use3DMode - Whether to use 3D motion mode
   * @returns {boolean} True if handled
   */
  handleOpenHand(handState, use3DMode = false) {
    this.setNormalAppearance();
    this.moveToHandPosition(handState, null, use3DMode);
    return true;
  }

  /**
   * Handle closed fist gesture (grab)
   * @param {Object} handState - Hand state data
   * @param {boolean} use3DMode - Whether to use 3D motion mode
   * @returns {boolean} True if handled
   */
  handleClosedFist(handState, use3DMode = false) {
    this.setGrabbedAppearance();
    this.isGrabbed = true;

    // Calculate hand world position for beam
    const handWorldPos = this.mapHandToWorldPosition(handState, use3DMode);
    this.updateBeam(handWorldPos);

    this.moveToHandPosition(handState, 0.25, use3DMode); // Faster movement when grabbed
    return true;
  }

  updateBeam(handPos) {
    if (!this.mesh || !this.isGrabbed) {
      if (this.beamMesh) {
        this.beamMesh.dispose();
        this.beamMesh = null;
      }
      return;
    }

    const points = [
      handPos,
      this.mesh.position
    ];

    if (!this.beamMesh) {
      this.beamMesh = MeshBuilder.CreateLines("beam", { points }, this.scene);
      this.beamMesh.color = this.baseColor || Color3.FromHexString("#FF7F50");
      this.beamMesh.alpha = 0.6;
    } else {
      this.beamMesh = MeshBuilder.CreateLines("beam", { points, instance: this.beamMesh });
    }
  }

  /**
   * Handle pinch gesture (scale)
   * @param {Object} handState - Hand state data
   * @param {boolean} use3DMode - Whether to use 3D motion mode
   * @returns {boolean} True if handled
   */
  handlePinch(handState, use3DMode = false) {
    this.setPinchAppearance();
    this.scaleWithFingerSpread(handState);
    // Still move in 3D mode while scaling
    if (use3DMode) {
      this.moveToHandPosition(handState, null, use3DMode);
    }
    return true;
  }

  handleVictory(handState, use3DMode) {
    // Spin effect
    this.mesh.rotation.y += 0.1;
    this.createCollisionEffect();
    return true;
  }

  handleThumbsUp(handState, use3DMode) {
    // Jump effect
    this.addMomentum(new Vector3(0, 0.5, 0));
    return true;
  }

  handleRockOn(handState, use3DMode) {
    // Random color
    this.material.emissiveColor = new Color3(Math.random(), Math.random(), Math.random());
    return true;
  }

  handlePoint(handState, use3DMode) {
    // Highlight / Select
    this.isSelected = !this.isSelected;
    if (this.isSelected) {
      this.material.emissiveColor = Color3.White();
    } else {
      this.setNormalAppearance();
    }
    return true;
  }

  handleOKSign(handState, use3DMode) {
    // Reset
    this.reset();
    return true;
  }

  /**
   * Handle default state
   * @param {Object} handState - Hand state data
   * @returns {boolean} True if handled
   */
  handleDefault(handState) {
    this.setNormalAppearance();
    this.isGrabbed = false;
    this.updateBeam(null); // Remove beam
    return false;
  }

  /**
   * Move cube to hand position with smooth interpolation
   * @param {Object} handState - Hand state data
   * @param {number} speed - Movement speed multiplier
   * @param {boolean} use3DMode - Whether to use 3D motion mode
   */
  moveToHandPosition(handState, speed = null, use3DMode = false) {
    const targetPosition = this.mapHandToWorldPosition(handState, use3DMode);
    const lerpFactor = speed || this.smoothingFactor;

    // Apply boundaries
    const boundedPosition = this.applyBoundaries(targetPosition);

    // Smooth interpolation
    this.mesh.position.x += (boundedPosition.x - this.mesh.position.x) * lerpFactor;
    this.mesh.position.y += (boundedPosition.y - this.mesh.position.y) * lerpFactor;
    this.mesh.position.z += (boundedPosition.z - this.mesh.position.z) * lerpFactor;

    // Apply hand orientation rotation if in 3D mode and orientation is available
    if (use3DMode && handState.orientation && this.handOrientationRotation) {
      this.applyHandOrientationRotation(handState.orientation);
    }
  }

  /**
   * Scale cube based on finger spread
   * @param {Object} handState - Hand state data
   */
  scaleWithFingerSpread(handState) {
    if (!this.lastHandPosition) {
      this.lastHandPosition = { fingerSpread: handState.fingerSpread };
      return;
    }

    const spreadDelta = handState.fingerSpread - this.lastHandPosition.fingerSpread;
    const scaleDelta = spreadDelta * this.scaleSpeed;

    const currentScale = this.mesh.scaling.x;
    const newScale = Math.max(
      this.minScale,
      Math.min(this.maxScale, currentScale + scaleDelta)
    );

    this.mesh.scaling = new Vector3(newScale, newScale, newScale);
    this.lastHandPosition.fingerSpread = handState.fingerSpread;
  }

  /**
   * Map hand position to world coordinates using CoordinateMapper
   * @param {Object} handState - Hand state data
   * @param {boolean} use3DMode - Whether to use 3D motion mode mapping
   * @returns {Vector3} World position
   */
  mapHandToWorldPosition(handState, use3DMode = false) {
    // 1. 3D Mode Direct Mapping (if available)
    if (use3DMode && handState.position.z !== undefined) {
      return new Vector3(
        handState.position.x,
        handState.position.y,
        handState.position.z
      );
    }

    // 2. Coordinate Mapper (Robust Unprojection)
    const coordinateMapper = this.scene.getCoordinateMapper ? this.scene.getCoordinateMapper() : null;

    if (coordinateMapper) {
      try {
        // Calculate target depth from finger spread (Push/Pull)
        // Spread 0-200 -> Depth 5-30 units from camera
        const normalizedSpread = Math.min(1, Math.max(0, handState.fingerSpread / 150));
        // Invert: Open palm (high spread) = Far, Fist (low spread) = Close? 
        // Or typical telekinesis: Pinch/Grab controls Z?
        // Let's stick to the existing feel: Spread maps to Z depth.

        const minDepth = 30; // Closer to camera (Z ~ -20)
        const maxDepth = 70; // Further from camera (Z ~ +20)
        const targetDepth = minDepth + normalizedSpread * (maxDepth - minDepth);

        return coordinateMapper.map(handState.position, targetDepth);

      } catch (error) {
        console.warn('Coordinate mapping failed:', error);
      }
    }

    // 3. Fallback to Legacy Mapping
    return this.mapHandToWorldPositionLegacy(handState);
  }

  /**
   * Legacy mapping fallback
   * @param {Object} handState - Hand state data
   * @returns {Vector3} World position
   */
  mapHandToWorldPositionLegacy(handState) {
    const videoWidth = 640;
    const videoHeight = 480;

    // Normalize coordinates -1 to 1
    const nx = (handState.position.x / videoWidth) * 2 - 1;
    const ny = -((handState.position.y / videoHeight) * 2 - 1);

    // Scale to scene bounds
    const x = nx * (this.boundarySize.width / 2);
    const y = ny * (this.boundarySize.height / 2);

    // Z from spread
    const z = (handState.fingerSpread / 200) * this.boundarySize.depth - (this.boundarySize.depth / 2);

    return new Vector3(x, y, z);
  }

  /**
   * Apply movement boundaries
   * @param {Vector3} position - Target position
   * @returns {Vector3} Bounded position
   */
  applyBoundaries(position) {
    const halfWidth = this.boundarySize.width / 2;
    const halfHeight = this.boundarySize.height / 2;
    const halfDepth = this.boundarySize.depth / 2;

    return new Vector3(
      Math.max(-halfWidth, Math.min(halfWidth, position.x)),
      Math.max(-halfHeight, Math.min(halfHeight, position.y)),
      Math.max(-halfDepth, Math.min(halfDepth, position.z))
    );
  }

  /**
   * Apply hand orientation to cube rotation
   * @param {Object} orientation - Hand orientation {pitch, yaw, roll}
   */
  applyHandOrientationRotation(orientation) {
    if (!this.mesh || !orientation) return;

    // Convert hand orientation to cube rotation with smoothing
    const targetRotation = new Vector3(
      orientation.pitch * 0.5,  // Scale down for more natural movement
      orientation.yaw * 0.5,
      orientation.roll * 0.3
    );

    // Apply smoothing to rotation
    if (!this.lastHandOrientation) {
      this.lastHandOrientation = targetRotation.clone();
    }

    this.lastHandOrientation.x += (targetRotation.x - this.lastHandOrientation.x) * this.rotationSmoothing;
    this.lastHandOrientation.y += (targetRotation.y - this.lastHandOrientation.y) * this.rotationSmoothing;
    this.lastHandOrientation.z += (targetRotation.z - this.lastHandOrientation.z) * this.rotationSmoothing;

    // Apply to mesh
    this.mesh.rotation.x = this.lastHandOrientation.x;
    this.mesh.rotation.y = this.lastHandOrientation.y;
    this.mesh.rotation.z = this.lastHandOrientation.z;
  }



  /**
   * Get cube information for UI
   * @returns {Object} Cube information
   */
  getInfo() {
    if (!this.mesh) {
      return null;
    }

    return {
      name: this.name,
      position: {
        x: Math.round(this.mesh.position.x * 10) / 10,
        y: Math.round(this.mesh.position.y * 10) / 10,
        z: Math.round(this.mesh.position.z * 10) / 10
      },
      scale: Math.round(this.mesh.scaling.x * 100) / 100,
      isSelected: this.isSelected,
      isGrabbed: this.isGrabbed
    };
  }

  /**
   * Reset cube to initial state
   */
  reset() {
    if (this.mesh) {
      this.mesh.position = Vector3.Zero();
      this.mesh.scaling = new Vector3(this.initialScale, this.initialScale, this.initialScale);
      this.mesh.rotation = Vector3.Zero();
    }

    this.isSelected = false;
    this.isGrabbed = false;
    this.lastHandPosition = null;
    this.setNormalAppearance();
  }

  /**
   * Get object status (alias for getInfo to match ObjectManager expectations)
   */
  getStatus() {
    return this.getInfo();
  }

  /**
   * Get the mesh instance
   * @returns {Mesh|null} Mesh instance
   */
  getMesh() {
    return this.mesh;
  }

  /**
   * Update cube with hand orientation for rotation
   * @param {Object} handState - Hand state data
   */
  updateRotationWithHandOrientation(handState) {
    if (!this.handOrientationRotation || !handState.landmarks) {
      return;
    }

    try {
      // Calculate hand orientation from landmarks
      const orientation = this.calculateHandOrientation(handState.landmarks);

      if (this.lastHandOrientation) {
        // Apply smooth rotation based on hand orientation changes
        const rotationDelta = {
          x: (orientation.pitch - this.lastHandOrientation.pitch) * this.rotationSpeed,
          y: (orientation.yaw - this.lastHandOrientation.yaw) * this.rotationSpeed,
          z: (orientation.roll - this.lastHandOrientation.roll) * this.rotationSpeed
        };

        // Apply rotation with smoothing
        this.mesh.rotation.x += rotationDelta.x * this.rotationSmoothing;
        this.mesh.rotation.y += rotationDelta.y * this.rotationSmoothing;
        this.mesh.rotation.z += rotationDelta.z * this.rotationSmoothing;
      }

      this.lastHandOrientation = orientation;
    } catch (error) {
      console.warn('Hand orientation rotation error:', error);
    }
  }

  /**
   * Calculate hand orientation from landmarks
   * @param {Array} landmarks - Hand landmarks
   * @returns {Object} Orientation angles
   */
  calculateHandOrientation(landmarks) {
    // Use key landmarks to calculate orientation
    const wrist = landmarks[0];
    const middleFinger = landmarks[12];
    const thumb = landmarks[4];
    const pinky = landmarks[20];

    // Calculate vectors
    const palmVector = [
      middleFinger[0] - wrist[0],
      middleFinger[1] - wrist[1],
      middleFinger[2] - wrist[2]
    ];

    const thumbVector = [
      thumb[0] - wrist[0],
      thumb[1] - wrist[1],
      thumb[2] - wrist[2]
    ];

    // Calculate orientation angles
    const pitch = Math.atan2(palmVector[1], palmVector[2]);
    const yaw = Math.atan2(palmVector[0], palmVector[2]);
    const roll = Math.atan2(thumbVector[1], thumbVector[0]);

    return { pitch, yaw, roll };
  }

  /**
   * Apply physics simulation
   */
  updatePhysics() {
    if (!this.enablePhysics || !this.mesh) {
      return;
    }

    // Apply gravity
    this.velocity = this.velocity.add(this.gravity);

    // Apply momentum
    this.velocity = this.velocity.add(this.momentum);

    // Apply friction
    this.velocity = this.velocity.scale(this.friction);
    this.momentum = this.momentum.scale(this.friction * 0.95);

    // Update position
    this.mesh.position = this.mesh.position.add(this.velocity);

    // Boundary collision detection
    this.handleBoundaryCollisions();

    // Reset small velocities to prevent jitter
    if (this.velocity.length() < 0.001) {
      this.velocity = Vector3.Zero();
    }
    if (this.momentum.length() < 0.001) {
      this.momentum = Vector3.Zero();
    }
  }

  /**
   * Handle boundary collisions with physics
   */
  handleBoundaryCollisions() {
    const pos = this.mesh.position;
    const bounds = this.boundarySize;
    let collided = false;

    // X boundaries
    if (pos.x > bounds.width / 2) {
      this.mesh.position.x = bounds.width / 2;
      this.velocity.x *= -this.bounce;
      this.momentum.x *= -this.bounce;
      collided = true;
    } else if (pos.x < -bounds.width / 2) {
      this.mesh.position.x = -bounds.width / 2;
      this.velocity.x *= -this.bounce;
      this.momentum.x *= -this.bounce;
      collided = true;
    }

    // Y boundaries
    if (pos.y > bounds.height / 2) {
      this.mesh.position.y = bounds.height / 2;
      this.velocity.y *= -this.bounce;
      this.momentum.y *= -this.bounce;
      collided = true;
    } else if (pos.y < -bounds.height / 2) {
      this.mesh.position.y = -bounds.height / 2;
      this.velocity.y *= -this.bounce;
      this.momentum.y *= -this.bounce;
      collided = true;
    }

    // Z boundaries
    if (pos.z > bounds.depth / 2) {
      this.mesh.position.z = bounds.depth / 2;
      this.velocity.z *= -this.bounce;
      this.momentum.z *= -this.bounce;
      collided = true;
    } else if (pos.z < -bounds.depth / 2) {
      this.mesh.position.z = -bounds.depth / 2;
      this.velocity.z *= -this.bounce;
      this.momentum.z *= -this.bounce;
      collided = true;
    }

    // Add visual feedback on collision
    if (collided) {
      this.createCollisionEffect();
    }
  }

  /**
   * Create visual effect on collision
   */
  createCollisionEffect() {
    if (!this.material) return;

    // Flash effect
    const originalEmissive = this.material.emissiveColor.clone();
    this.material.emissiveColor = new Color3(0.3, 0.3, 0.3);

    setTimeout(() => {
      if (this.material) {
        this.material.emissiveColor = originalEmissive;
      }
    }, 100);
  }

  /**
   * Add momentum to the cube (for physics-based movement)
   * @param {Vector3} force - Force vector to apply
   */
  addMomentum(force) {
    if (this.enablePhysics) {
      this.momentum = this.momentum.add(force);
    }
  }

  /**
   * Dispose cube resources
   */
  dispose() {
    // Stop animations (they don't have dispose method)
    this.animations.forEach(animation => {
      if (animation && animation.stop) {
        animation.stop();
      }
    });
    this.animations.clear();

    // Dispose material
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }

    // Dispose mesh
    if (this.mesh) {
      this.mesh.dispose();
      this.mesh = null;
    }

    if (this.beamMesh) {
      this.beamMesh.dispose();
      this.beamMesh = null;
    }

    this.isInitialized = false;
    console.log(`🗑️ Interactive cube '${this.name}' disposed`);
  }
}

export default CyberObject;
