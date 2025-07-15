import {
  Engine,
  HDRCubeTexture,
  Scene,
  UniversalCamera,
  HemisphericLight,
  Vector3,
  Color3,
  StandardMaterial,
  Texture,
  AssetsManager,
  Mesh,
  ActionManager,
  MeshBuilder
 } from "@babylonjs/core"
import * as GUI from "@babylonjs/gui";
import moonlitGolfHDRUrl from './moonlit_golf_2k.hdr?url';
import { GESTURE_TYPES } from './index.js';
import { ObjectManager } from './ObjectManager';

export default class Game{

  constructor(canvas){
    try {
      this.canvas = canvas;
      this.engine = new Engine(this.canvas, true);
      this.scene = new Scene(this.engine);
      this.scene.clearColor = Color3.FromHexString("#888888");

      // Initialize keyboard input
      this.scene.actionManager = new ActionManager(this.scene);

      this.createScene();
      this.runEngineLoop();

      // Setup WebGL error handling
      this.setupWebGLErrorHandling();
    } catch (error) {
      console.error("Error initializing Game:", error);
      throw error;
    }
    this.boxMinSize = 3;
    this.boxMaxSize = 8;
    this.moveSpeed = 0.5;
    this.lastHandPosition = null;
    this.isScalingMode = false;
    this.initialFingerSpread = 0;
    this.initialScale = this.boxMinSize;
    
    // Enhanced gesture handling
    this.currentGesture = GESTURE_TYPES.NO_HAND;
    this.gestureStartTime = null;
    this.gestureHoldTime = 1000; // Time to hold gesture for special actions (ms)
    this.lastGestureAction = null;
    this.gestureCooldown = 500; // Cooldown between gesture actions (ms)
    
    // Game state
    this.gameMode = 'normal'; // 'normal', 'selection', 'special'
    this.selectedObjects = [];
    this.specialEffects = [];

    // Initialize multi-object system
    this.objectManager = null; // Will be initialized after scene creation
  }

  createScene(){
    this.camera = new UniversalCamera("UniversalCamera", new Vector3(-90, -10, -10), this.scene);
    this.camera.rotation.x = -3;
    this.camera.setTarget(Vector3.Zero());
    this.camera.attachControl(this.canvas, true);
    this.camera.keysLeft= [65];
    this.camera.keysRight=[68];
    this.camera.keysUp = [87];
    this.camera.keysDown = [83];

    //add light
    this.addLighting();
    // Skybox
    this.generateSkybox();
    
    this.generateMeshes();
    // this.generateModels();

    // Initialize object manager after scene is ready
    this.scene.executeWhenReady(() => {
      try {
        this.objectManager = new ObjectManager(this.scene);
        console.log("✅ ObjectManager initialized successfully");
      } catch (error) {
        console.error("❌ Error initializing ObjectManager:", error);
        this.objectManager = null;
      }
    });

    return this.scene;
  }
  runEngineLoop(){
    this.engine.runRenderLoop(() => {
      try {
        // Only render if scene is ready and has active camera
        if (this.scene && this.scene.activeCamera && this.scene.isReady()) {
          this.scene.render();
        }
      } catch (error) {
        console.warn("Render loop error:", error);
        // Continue rendering on next frame
      }
    });
  }
  getGameInstance(){
    return this.canvas;
  }

  addLighting(){
    var light = new HemisphericLight("hemiLight", new Vector3(-1, 1, 0), this.scene);
    light.diffuse = new Color3(1, 0, 0);
  }

  generateSkybox(){
    this.skybox = MeshBuilder.CreateBox("skyBox", {size:300.0}, this.scene);
    // skybox.checkCollisions = true;
    this.skybox.ellipsoid = new Vector3(3,3,3);

    this.skyboxMaterial = new StandardMaterial("skyBox", this.scene);
    this.skyboxMaterial.backFaceCulling = false;
    this.skyboxMaterial.reflectionTexture = new HDRCubeTexture(moonlitGolfHDRUrl, this.scene, 512, false, true, false, true);
    this.skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
    this.skyboxMaterial.disableLighting = true;

    this.skybox.material = this.skyboxMaterial;
  }

  generateModels(){
    this.assetsLoader = new AssetsManager(this.scene);
    this.planeModel = this.assetsLoader.addMeshTask("ship", "", "models/", "ship.obj");

    this.assetsLoader.onFinish = (tasks) => {
      console.log(this.scene.meshes.length);
      this.runEngineLoop();
      console.log('assets loaded');
    }
    this.assetsLoader.load();
  }

  generateMeshes(){
    this.box1 = MeshBuilder.CreateBox("Box1", {size: 5}, this.scene);

    const coralMaterial = new StandardMaterial("coral_mat", this.scene);
    coralMaterial.diffuseColor = Color3.FromHexString("#FF7F50");
    this.box1.material = coralMaterial;

    // Set initial position to center of scene
    this.box1.position.x = 0;
    this.box1.position.y = 0;
    this.box1.position.z = 0;

    this.scene.gravity = new Vector3(0, -9.81, 0);
    this.scene.collisionsEnabled = true;
  }

  // Enhanced gesture handling
  handleGesture(handState) {
    if (!handState || !handState.isTracking) {
      this.resetGestureState();
      return;
    }

    const currentTime = Date.now();
    const newGesture = handState.gesture;
    const confidence = handState.confidence;

    // Check if gesture has changed
    if (newGesture !== this.currentGesture) {
      this.currentGesture = newGesture;
      this.gestureStartTime = currentTime;
      this.lastGestureAction = null;
    }

    // Handle different gestures based on confidence
    if (confidence > 0.7) {
      this.processGesture(newGesture, handState, currentTime);
    }
  }

  processGesture(gesture, handState, currentTime) {
    const gestureDuration = currentTime - this.gestureStartTime;
    const canPerformAction = !this.lastGestureAction ||
                           (currentTime - this.lastGestureAction) > this.gestureCooldown;

    // Try to handle gesture with ObjectManager first
    if (this.objectManager) {
      const handled = this.objectManager.handleGesture(gesture, handState, gestureDuration);
      if (handled) {
        this.lastGestureAction = currentTime;
        return;
      }
    }

    // Fallback to legacy gesture handling for backward compatibility
    switch (gesture) {
      case GESTURE_TYPES.OPEN_HAND:
        this.handleOpenHand(handState);
        break;

      case GESTURE_TYPES.CLOSED_FIST:
        this.handleClosedFist(handState, gestureDuration, canPerformAction);
        break;

      case GESTURE_TYPES.PINCH:
        this.handlePinch(handState);
        break;

      case GESTURE_TYPES.POINT:
        this.handlePoint(handState, gestureDuration, canPerformAction);
        break;

      case GESTURE_TYPES.VICTORY:
        this.handleVictory(handState, gestureDuration, canPerformAction);
        break;

      case GESTURE_TYPES.THUMBS_UP:
        this.handleThumbsUp(handState, gestureDuration, canPerformAction);
        break;

      case GESTURE_TYPES.ROCK_ON:
        this.handleRockOn(handState, gestureDuration, canPerformAction);
        break;

      case GESTURE_TYPES.OK_SIGN:
        this.handleOKSign(handState, gestureDuration, canPerformAction);
        break;

      default:
        this.handleDefaultGesture(handState);
    }
  }

  handleOpenHand(handState) {
    // Movement mode - standard box movement
    this.gameMode = 'normal';
    this.moveBox(handState);
  }

  handleClosedFist(handState, duration, canPerformAction) {
    // Grab mode - can grab and move objects
    this.gameMode = 'grab';
    
    if (duration > this.gestureHoldTime && canPerformAction) {
      this.performGrabAction(handState);
      this.lastGestureAction = Date.now();
    } else {
      this.moveBox(handState);
    }
  }

  handlePinch(handState) {
    // Resize mode
    this.gameMode = 'resize';
    this.resizeBox(handState);
  }

  handlePoint(handState, duration, canPerformAction) {
    // Selection mode
    this.gameMode = 'selection';
    
    if (duration > this.gestureHoldTime && canPerformAction) {
      this.performSelectionAction(handState);
      this.lastGestureAction = Date.now();
    }
  }

  handleVictory(handState, duration, canPerformAction) {
    // Special action mode
    this.gameMode = 'special';
    
    if (duration > this.gestureHoldTime && canPerformAction) {
      this.performVictoryAction(handState);
      this.lastGestureAction = Date.now();
    }
  }

  handleThumbsUp(handState, duration, canPerformAction) {
    // Confirm action
    if (duration > this.gestureHoldTime && canPerformAction) {
      this.performConfirmAction(handState);
      this.lastGestureAction = Date.now();
    }
  }

  handleRockOn(handState, duration, canPerformAction) {
    // Special effect mode
    if (duration > this.gestureHoldTime && canPerformAction) {
      this.performRockOnAction(handState);
      this.lastGestureAction = Date.now();
    }
  }

  handleOKSign(handState, duration, canPerformAction) {
    // Reset/clear action
    if (duration > this.gestureHoldTime && canPerformAction) {
      this.performResetAction(handState);
      this.lastGestureAction = Date.now();
    }
  }

  handleDefaultGesture(handState) {
    // Default movement
    this.gameMode = 'normal';
    this.moveBox(handState);
  }

  // Action implementations
  performGrabAction(handState) {
    console.log('Grab action performed');
    // Add grab effect to box
    this.addGrabEffect();
  }

  performSelectionAction(handState) {
    console.log('Selection action performed');
    // Add selection effect
    this.addSelectionEffect();
  }

  performVictoryAction(handState) {
    console.log('Victory action performed');
    // Add victory effect
    this.addVictoryEffect();
  }

  performConfirmAction(handState) {
    console.log('Confirm action performed');
    // Confirm current action
    this.confirmCurrentAction();
  }

  performRockOnAction(handState) {
    console.log('Rock on action performed');
    // Add rock on effect
    this.addRockOnEffect();
  }

  performResetAction(handState) {
    console.log('Reset action performed');
    // Reset game state
    this.resetGameState();
  }

  // Effect methods
  addGrabEffect() {
    if (this.box1) {
      const material = this.box1.material;
      material.emissiveColor = new Color3(0.2, 0.2, 0.2);
      setTimeout(() => {
        material.emissiveColor = new Color3(0, 0, 0);
      }, 500);
    }
  }

  addSelectionEffect() {
    if (this.box1) {
      const material = this.box1.material;
      const originalColor = material.diffuseColor;
      material.diffuseColor = new Color3(0, 1, 0);
      setTimeout(() => {
        material.diffuseColor = originalColor;
      }, 1000);
    }
  }

  addVictoryEffect() {
    if (this.box1) {
      // Add rotation effect
      const originalRotation = this.box1.rotation.clone();
      this.box1.rotation.y += Math.PI * 2;
      setTimeout(() => {
        this.box1.rotation = originalRotation;
      }, 1000);
    }
  }

  addRockOnEffect() {
    if (this.box1) {
      // Add scale bounce effect
      const originalScale = this.box1.scaling.clone();
      this.box1.scaling.scaleInPlace(1.5);
      setTimeout(() => {
        this.box1.scaling = originalScale;
      }, 300);
    }
  }

  confirmCurrentAction() {
    // Confirm the current game mode action
    console.log(`Confirmed action in ${this.gameMode} mode`);
  }

  resetGameState() {
    // Reset box to original state
    if (this.box1) {
      this.box1.position = new Vector3(0, 0, 0);
      this.box1.scaling = new Vector3(1, 1, 1);
      this.box1.rotation = new Vector3(0, 0, 0);
    }
    this.gameMode = 'normal';
  }

  resetGestureState() {
    this.currentGesture = GESTURE_TYPES.NO_HAND;
    this.gestureStartTime = null;
    this.gameMode = 'normal';
  }

  // Enhanced box movement with gesture awareness
  moveBox(handState) {
    if (!handState || !handState.isTracking || !this.box1) return;

    // Initialize last position if not set
    if (!this.lastHandPosition && handState.isTracking) {
      this.lastHandPosition = { ...handState.position };
      return;
    }

    // Handle different movement modes based on gesture
    if (this.gameMode === 'resize') {
      this.resizeBox(handState);
    } else {
      this.performMovement(handState);
    }

    // Update last position
    this.lastHandPosition = { ...handState.position };
  }

  performMovement(handState) {
    // Get canvas dimensions
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    // Map webcam coordinates (640x480) to scene coordinates
    const sceneWidth = 100;
    const sceneHeight = 80;

    // Calculate mapped coordinates
    const mappedX = ((handState.position.x / 640) * sceneWidth) - (sceneWidth / 2);
    const mappedY = ((1 - handState.position.y / 480) * sceneHeight) - (sceneHeight / 2);

    // Calculate box boundaries
    const boxSize = this.box1.scaling.x * 5;
    const boundaryOffset = boxSize / 2;

    // Apply boundaries
    const targetX = Math.max(
      -(sceneWidth/2) + boundaryOffset,
      Math.min(sceneWidth/2 - boundaryOffset, mappedX)
    );
    
    const targetY = Math.max(
      -(sceneHeight/2) + boundaryOffset,
      Math.min(sceneHeight/2 - boundaryOffset, mappedY)
    );

    // Smooth movement with gesture-based speed
    let lerpFactor = 0.1;
    if (this.gameMode === 'grab') {
      lerpFactor = 0.15; // Faster movement in grab mode
    } else if (this.gameMode === 'selection') {
      lerpFactor = 0.05; // Slower, more precise movement in selection mode
    }

    this.box1.position.x += (targetX - this.box1.position.x) * lerpFactor;
    this.box1.position.y += (targetY - this.box1.position.y) * lerpFactor;
  }

  resizeBox(handState) {
    if (!this.isScalingMode) {
      this.isScalingMode = true;
      this.initialFingerSpread = handState.fingerSpread;
      this.initialScale = this.box1.scaling.x;
    } else {
      const scaleDelta = (handState.fingerSpread - this.initialFingerSpread) / 100;
      const newScale = Math.max(
        this.boxMinSize,
        Math.min(this.boxMaxSize, this.initialScale + scaleDelta)
      );
      
      this.box1.scaling.x = newScale;
      this.box1.scaling.y = newScale;
      this.box1.scaling.z = newScale;
    }
  }

  // Main entry point for hand state updates
  updateHandState(handState) {
    this.handleGesture(handState);
  }

  // Get information for UI components
  getAllObjects() {
    return this.objectManager ? this.objectManager.getAllObjectStatuses() : [];
  }

  getSelectedObject() {
    return this.objectManager ? this.objectManager.getSelectedObjectStatus() : null;
  }

  getGestureCompatibility(gesture) {
    return this.objectManager ? this.objectManager.getGestureCompatibility(gesture) : [];
  }

  // Legacy method for backward compatibility
  getBoxInfo() {
    if (this.box1) {
      return {
        position: {
          x: Math.round(this.box1.position.x * 10) / 10,
          y: Math.round(this.box1.position.y * 10) / 10,
          z: Math.round(this.box1.position.z * 10) / 10
        },
        scale: Math.round(this.box1.scaling.x * 100) / 100,
        size: Math.round(this.box1.scaling.x * 5 * 10) / 10
      };
    }
    return null;
  }

  // Setup WebGL error handling
  setupWebGLErrorHandling() {
    if (!this.canvas || !this.engine) return;

    // Handle WebGL context lost
    this.canvas.addEventListener('webglcontextlost', (event) => {
      console.warn('🔥 WebGL context lost');
      event.preventDefault();
      this.handleWebGLContextLost();
    });

    // Handle WebGL context restored
    this.canvas.addEventListener('webglcontextrestored', (event) => {
      console.log('🔄 WebGL context restored');
      this.handleWebGLContextRestored();
    });

    // Monitor WebGL errors
    this.setupWebGLErrorMonitoring();
  }

  handleWebGLContextLost() {
    // Stop render loop
    this.engine.stopRenderLoop();

    // Mark as context lost
    this.isContextLost = true;

    // Notify user
    if (window.useGameStore) {
      window.useGameStore.getState().addError('WebGL context lost. The 3D scene will be restored automatically.');
    }
  }

  handleWebGLContextRestored() {
    try {
      // Recreate the scene
      this.scene = new Scene(this.engine);
      this.scene.clearColor = Color3.FromHexString("#888888");
      this.createScene();

      // Restart render loop
      this.runEngineLoop();

      // Mark as restored
      this.isContextLost = false;

      console.log('✅ WebGL context and scene restored');
    } catch (error) {
      console.error('❌ Failed to restore WebGL context:', error);
    }
  }

  setupWebGLErrorMonitoring() {
    // Wrap WebGL calls to catch errors
    const gl = this.engine._gl;
    if (!gl) return;

    const originalGetError = gl.getError.bind(gl);
    gl.getError = () => {
      const error = originalGetError();
      if (error !== gl.NO_ERROR) {
        console.warn('WebGL Error:', this.getWebGLErrorString(error));
      }
      return error;
    };
  }

  getWebGLErrorString(error) {
    const gl = this.engine._gl;
    if (!gl) return 'Unknown error';

    switch (error) {
      case gl.INVALID_ENUM: return 'INVALID_ENUM';
      case gl.INVALID_VALUE: return 'INVALID_VALUE';
      case gl.INVALID_OPERATION: return 'INVALID_OPERATION';
      case gl.OUT_OF_MEMORY: return 'OUT_OF_MEMORY';
      case gl.CONTEXT_LOST_WEBGL: return 'CONTEXT_LOST_WEBGL';
      default: return `Unknown error (${error})`;
    }
  }

  handleWebGLError(error) {
    console.error('🔥 WebGL Error in render loop:', error);

    // Try to recover
    if (error.message.includes('uniformMatrix4fv')) {
      console.log('🔄 Attempting to recover from uniformMatrix4fv error...');

      // Dispose problematic objects
      if (this.objectManager) {
        this.objectManager.dispose();
        this.objectManager = null;
      }

      // Recreate object manager
      setTimeout(() => {
        try {
          this.objectManager = new ObjectManager(this.scene);
          console.log('✅ ObjectManager recreated after WebGL error');
        } catch (recreateError) {
          console.error('❌ Failed to recreate ObjectManager:', recreateError);
        }
      }, 1000);
    }
  }

  dispose() {
    this.isDisposed = true;

    if (this.objectManager) {
      this.objectManager.dispose();
    }

    // Stop render loop
    if (this.engine) {
      this.engine.stopRenderLoop();
    }

    // Dispose scene
    if (this.scene) {
      this.scene.dispose();
    }

    // Dispose engine
    if (this.engine) {
      this.engine.dispose();
    }

    // Remove event listeners
    if (this.canvas) {
      this.canvas.removeEventListener('webglcontextlost', this.handleWebGLContextLost);
      this.canvas.removeEventListener('webglcontextrestored', this.handleWebGLContextRestored);
    }

    console.log('🗑️ Game disposed successfully');
  }
}
