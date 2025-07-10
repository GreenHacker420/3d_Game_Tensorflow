import { Vector3, Color3, StandardMaterial, Animation, AnimationGroup } from "@babylonjs/core";
import { GESTURE_TYPES } from './gestureRecognition';

export class InteractiveObject {
  constructor(mesh, scene, type, id) {
    this.mesh = mesh;
    this.scene = scene;
    this.type = type; // 'cube', 'sphere', 'pyramid', 'cylinder'
    this.id = id;
    
    // Object state
    this.isSelected = false;
    this.isGrabbed = false;
    this.isActive = false;
    this.originalPosition = mesh.position.clone();
    this.originalScale = mesh.scaling.clone();
    this.originalRotation = mesh.rotation.clone();
    
    // Gesture interaction properties
    this.supportedGestures = this.getSupportedGestures();
    this.lastGestureTime = 0;
    this.gestureEffectDuration = 1000; // 1 second
    
    // Visual properties
    this.originalMaterial = mesh.material;
    this.glowMaterial = null;
    this.createGlowMaterial();
    
    // Animation properties
    this.animations = [];
    this.currentAnimation = null;
  }

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
    
    return gestureMap[this.type] || [];
  }

  createGlowMaterial() {
    this.glowMaterial = new StandardMaterial(`${this.type}_glow_${this.id}`, this.scene);
    this.glowMaterial.diffuseColor = this.originalMaterial.diffuseColor.clone();
    this.glowMaterial.emissiveColor = new Color3(0.2, 0.2, 0.2);
    this.glowMaterial.specularColor = new Color3(1, 1, 1);
  }

  canHandleGesture(gesture) {
    return this.supportedGestures.includes(gesture);
  }

  handleGesture(gesture, handState, duration) {
    if (!this.canHandleGesture(gesture)) return false;

    const currentTime = Date.now();
    const canPerformAction = (currentTime - this.lastGestureTime) > 500; // 500ms cooldown

    if (!canPerformAction) return false;

    switch (gesture) {
      case GESTURE_TYPES.OPEN_HAND:
        return this.handleOpenHand(handState);
        
      case GESTURE_TYPES.CLOSED_FIST:
        return this.handleClosedFist(handState, duration);
        
      case GESTURE_TYPES.PINCH:
        return this.handlePinch(handState);
        
      case GESTURE_TYPES.POINT:
        return this.handlePoint(handState, duration);
        
      case GESTURE_TYPES.VICTORY:
        return this.handleVictory(handState, duration);
        
      case GESTURE_TYPES.THUMBS_UP:
        return this.handleThumbsUp(handState, duration);
        
      case GESTURE_TYPES.ROCK_ON:
        return this.handleRockOn(handState, duration);
        
      case GESTURE_TYPES.OK_SIGN:
        return this.handleOKSign(handState, duration);
        
      default:
        return false;
    }
  }

  handleOpenHand(handState) {
    // Move object based on hand position
    this.moveToHandPosition(handState);
    return true;
  }

  handleClosedFist(handState, duration) {
    if (duration > 1000) { // Hold for 1 second
      this.grab(handState);
      this.lastGestureTime = Date.now();
      return true;
    }
    return false;
  }

  handlePinch(handState) {
    // Resize object based on finger spread
    this.resizeObject(handState);
    return true;
  }

  handlePoint(handState, duration) {
    if (duration > 800) { // Hold for 0.8 seconds
      this.select();
      this.lastGestureTime = Date.now();
      return true;
    }
    return false;
  }

  handleVictory(handState, duration) {
    if (duration > 1200) { // Hold for 1.2 seconds
      this.performSpecialEffect();
      this.lastGestureTime = Date.now();
      return true;
    }
    return false;
  }

  handleThumbsUp(handState, duration) {
    if (duration > 1000) { // Hold for 1 second
      this.activate();
      this.lastGestureTime = Date.now();
      return true;
    }
    return false;
  }

  handleRockOn(handState, duration) {
    if (duration > 1500) { // Hold for 1.5 seconds
      this.transform();
      this.lastGestureTime = Date.now();
      return true;
    }
    return false;
  }

  handleOKSign(handState, duration) {
    if (duration > 2000) { // Hold for 2 seconds
      this.reset();
      this.lastGestureTime = Date.now();
      return true;
    }
    return false;
  }

  // Action implementations
  moveToHandPosition(handState) {
    if (!handState.position) return;
    
    // Map hand position to 3D space
    const targetX = ((handState.position.x / 640) * 100) - 50;
    const targetY = ((1 - handState.position.y / 480) * 80) - 40;
    
    // Smooth movement
    const lerpFactor = 0.1;
    this.mesh.position.x += (targetX - this.mesh.position.x) * lerpFactor;
    this.mesh.position.y += (targetY - this.mesh.position.y) * lerpFactor;
  }

  grab(handState) {
    this.isGrabbed = true;
    this.mesh.material = this.glowMaterial;
    
    // Add grab effect
    this.addGrabEffect();
    
    setTimeout(() => {
      this.isGrabbed = false;
      this.mesh.material = this.originalMaterial;
    }, this.gestureEffectDuration);
  }

  select() {
    this.isSelected = !this.isSelected;
    
    if (this.isSelected) {
      this.addSelectionEffect();
    } else {
      this.removeSelectionEffect();
    }
  }

  resizeObject(handState) {
    if (!handState.fingerSpread) return;
    
    const scaleFactor = Math.max(0.5, Math.min(3.0, handState.fingerSpread / 100));
    this.mesh.scaling = this.originalScale.scale(scaleFactor);
  }

  performSpecialEffect() {
    // Type-specific special effects
    switch (this.type) {
      case 'cube':
        this.spinEffect();
        break;
      case 'sphere':
        this.bounceEffect();
        break;
      case 'pyramid':
        this.glowEffect();
        break;
      case 'cylinder':
        this.stretchEffect();
        break;
    }
  }

  activate() {
    this.isActive = !this.isActive;
    
    if (this.isActive) {
      this.mesh.material.emissiveColor = new Color3(0.3, 0.3, 0.3);
    } else {
      this.mesh.material.emissiveColor = new Color3(0, 0, 0);
    }
  }

  transform() {
    // Change object color
    const colors = [
      new Color3(1, 0, 0), // Red
      new Color3(0, 1, 0), // Green
      new Color3(0, 0, 1), // Blue
      new Color3(1, 1, 0), // Yellow
      new Color3(1, 0, 1), // Magenta
      new Color3(0, 1, 1)  // Cyan
    ];
    
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    this.mesh.material.diffuseColor = randomColor;
  }

  reset() {
    this.mesh.position = this.originalPosition.clone();
    this.mesh.scaling = this.originalScale.clone();
    this.mesh.rotation = this.originalRotation.clone();
    this.mesh.material = this.originalMaterial;
    this.isSelected = false;
    this.isGrabbed = false;
    this.isActive = false;
  }

  // Visual effects
  addGrabEffect() {
    this.mesh.material.emissiveColor = new Color3(0.2, 0.2, 0.2);
  }

  addSelectionEffect() {
    // Add selection outline or glow
    this.mesh.material.emissiveColor = new Color3(0.1, 0.3, 0.1);
  }

  removeSelectionEffect() {
    this.mesh.material.emissiveColor = new Color3(0, 0, 0);
  }

  spinEffect() {
    this.mesh.rotation.y += Math.PI * 2;
  }

  bounceEffect() {
    const originalY = this.mesh.position.y;
    this.mesh.position.y += 10;
    setTimeout(() => {
      this.mesh.position.y = originalY;
    }, 500);
  }

  glowEffect() {
    this.mesh.material.emissiveColor = new Color3(0.5, 0.5, 0.5);
    setTimeout(() => {
      this.mesh.material.emissiveColor = new Color3(0, 0, 0);
    }, 1000);
  }

  stretchEffect() {
    const originalScale = this.mesh.scaling.clone();
    this.mesh.scaling.y *= 2;
    setTimeout(() => {
      this.mesh.scaling = originalScale;
    }, 800);
  }

  // Getters for UI
  getStatus() {
    return {
      id: this.id,
      type: this.type,
      position: this.mesh.position,
      scale: this.mesh.scaling,
      rotation: this.mesh.rotation,
      isSelected: this.isSelected,
      isGrabbed: this.isGrabbed,
      isActive: this.isActive,
      supportedGestures: this.supportedGestures
    };
  }

  dispose() {
    if (this.glowMaterial) {
      this.glowMaterial.dispose();
    }
    if (this.currentAnimation) {
      this.currentAnimation.stop();
    }
  }
}
