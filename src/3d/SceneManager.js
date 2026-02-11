import {
  Engine,
  Scene,
  Color3,
  Vector3,
  ActionManager,
  DefaultRenderingPipeline
} from "@babylonjs/core";
import { CoordinateMapper } from './utils/CoordinateMapper.js';
import { ObjectManager } from '../utils/ObjectManager.js';
import { GameZone } from '../objects/GameZone.js';

/**
 * Manages the main 3D scene setup and lifecycle
 */
export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.engine = null;
    this.scene = null;
    this.isInitialized = false;
    this.isDisposed = false;
    this.onError = null;
    this.renderLoop = null;

    // Store references for adaptive mapping
    this.videoElement = null;
    this.adaptiveMapper = null;

    // New Coordinate Mapper
    this.coordinateMapper = null;

    // Game Objects
    this.objectManager = null;
    this.gameZones = [];
    this.score = 0;

    // Game Event Callback
    this.onGameEvent = null;
  }

  /**
   * Initialize the 3D scene
   * @returns {Promise<Scene>} Initialized scene
   */
  async initialize() {
    if (this.isInitialized) {
      return this.scene;
    }

    try {
      // Create Babylon.js engine
      this.engine = new Engine(this.canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        antialias: true,
        alpha: false,
        premultipliedAlpha: false,
        powerPreference: "high-performance"
      });

      // Create scene
      this.scene = new Scene(this.engine);
      this.scene.clearColor = Color3.FromHexString("#1a1a1a");

      // Enable physics (basic)
      this.scene.gravity = new Vector3(0, -9.81, 0);
      this.scene.collisionsEnabled = true;

      // Setup action manager for input handling
      this.scene.actionManager = new ActionManager(this.scene);

      // Setup error handling
      this.setupErrorHandling();

      // Setup automatic resize
      this.setupResize();

      // Setup Post-Processing (Visual Overhaul)
      this.setupPostProcessing();

      // Initialize Coordinate Mapper
      this.coordinateMapper = new CoordinateMapper(this.scene);
      this.coordinateMapper.resize(); // Initial resize

      // Initialize Object Manager
      this.objectManager = new ObjectManager(this.scene);

      // Initialize Game Zones
      this.initializeGameZones();

      this.isInitialized = true;
      console.log('✅ 3D Scene initialized successfully');

      return this.scene;

    } catch (error) {
      const errorMessage = `Failed to initialize 3D scene: ${error.message}`;
      console.error('❌', errorMessage);
      this.notifyError(errorMessage);
      throw error;
    }
  }

  /**
   * Setup post-processing effects
   */
  setupPostProcessing() {
    if (!this.scene || !this.scene.activeCamera || !this.engine) return;

    try {
      // Dynamic import to avoid circular dependencies if any, though likely not needed for standard lib
      // using standard import for now as they are core

      this.pipeline = new DefaultRenderingPipeline(
        "cyber-pipeline", // The name of the pipeline
        true, // hdr?
        this.scene, // The scene instance
        [this.scene.activeCamera] // The list of cameras to be attached to
      );

      // Enable Bloom (Glow)
      this.pipeline.glowLayerEnabled = true;
      this.pipeline.bloomEnabled = true;
      this.pipeline.bloomThreshold = 0.6; // Threshold for glowing
      this.pipeline.bloomWeight = 0.4; // Intensity
      this.pipeline.bloomKernel = 64; // Blur amount
      this.pipeline.bloomScale = 0.5;

      // Chromatic Aberration (Glitch effect)
      this.pipeline.chromaticAberrationEnabled = true;
      this.pipeline.chromaticAberration.aberrationAmount = 5; // Slight shift
      this.pipeline.chromaticAberration.radialIntensity = 0.5;

      // Grain (Film Noise)
      this.pipeline.grainEnabled = true;
      this.pipeline.grain.intensity = 8;
      this.pipeline.grain.animated = true;

      console.log('✨ Post-processing pipeline initialized');
    } catch (error) {
      console.warn('⚠️ Failed to setup post-processing:', error);
    }
  }

  /**
   * Start the render loop
   */
  startRenderLoop() {
    if (!this.engine || !this.scene) {
      console.warn('Cannot start render loop: engine or scene not initialized');
      return;
    }

    this.renderLoop = () => {
      try {
        if (this.scene && this.scene.activeCamera && this.scene.isReady()) {
          // Game Loop Updates
          this.updateGameLoop();

          this.scene.render();
        }
      } catch (error) {
        console.warn('Render loop error:', error);
        // Continue rendering on next frame
      }
    };

    this.engine.runRenderLoop(this.renderLoop);
    console.log('✅ Render loop started');
  }

  /**
   * Stop the render loop
   */
  stopRenderLoop() {
    if (this.engine) {
      this.engine.stopRenderLoop();
      console.log('⏹️ Render loop stopped');
    }
  }

  /**
   * Setup error handling for WebGL context
   */
  setupErrorHandling() {
    if (!this.canvas) return;

    // Handle WebGL context lost
    this.canvas.addEventListener('webglcontextlost', (event) => {
      console.warn('🔥 WebGL context lost');
      event.preventDefault();
      this.handleContextLost();
    });

    // Handle WebGL context restored
    this.canvas.addEventListener('webglcontextrestored', (event) => {
      console.log('🔄 WebGL context restored');
      this.handleContextRestored();
    });
  }

  /**
   * Handle WebGL context lost
   */
  handleContextLost() {
    this.stopRenderLoop();
    this.notifyError('WebGL context lost. The 3D scene will be restored automatically.');
  }

  /**
   * Handle WebGL context restored
   */
  async handleContextRestored() {
    try {
      // Recreate the scene
      await this.initialize();
      this.startRenderLoop();
      console.log('✅ WebGL context and scene restored');
    } catch (error) {
      console.error('❌ Failed to restore WebGL context:', error);
      this.notifyError('Failed to restore 3D scene after context loss');
    }
  }

  /**
   * Setup automatic canvas resize
   */
  setupResize() {
    if (!this.engine) return;

    window.addEventListener('resize', () => {
      if (this.engine && !this.isDisposed) {
        this.engine.resize();
        if (this.coordinateMapper) {
          this.coordinateMapper.resize();
        }
      }
    });
  }

  /**
   * Get the current scene
   * @returns {Scene|null} Current scene
   */
  getScene() {
    return this.scene;
  }

  /**
   * Get the engine
   * @returns {Engine|null} Current engine
   */
  getEngine() {
    return this.engine;
  }

  /**
   * Check if scene is ready for rendering
   * @returns {boolean} True if ready
   */
  isReady() {
    return this.scene && this.scene.isReady() && this.scene.activeCamera;
  }

  /**
   * Set error callback
   * @param {Function} callback - Error callback function
   */
  setErrorCallback(callback) {
    this.onError = callback;
  }

  /**
   * Notify error
   * @param {string} error - Error message
   */
  notifyError(error) {
    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * Get performance information
   * @returns {Object} Performance metrics
   */
  getPerformanceInfo() {
    if (!this.engine) {
      return { fps: 0, deltaTime: 0 };
    }

    return {
      fps: Math.round(this.engine.getFps()),
      deltaTime: this.engine.getDeltaTime()
    };
  }

  /**
   * Set adaptive mapper reference
   * @param {Object} adaptiveMapper - Adaptive mapper instance
   */
  setAdaptiveMapper(adaptiveMapper) {
    this.adaptiveMapper = adaptiveMapper;

    // Make adaptive mapper available to scene objects
    if (this.scene) {
      this.scene.getAdaptiveMapper = () => this.adaptiveMapper;
    }
  }

  /**
   * Get adaptive mapper
   * @returns {Object} Adaptive mapper instance
   */
  getAdaptiveMapper() {
    return this.adaptiveMapper;
  }

  /**
   * Get coordinate mapper
   * @returns {CoordinateMapper} Coordinate mapper instance
   */
  getCoordinateMapper() {
    return this.coordinateMapper;
  }

  /**
   * Set video element reference for adaptive mapping
   * @param {HTMLVideoElement} videoElement - Video element
   */
  setVideoElement(videoElement) {
    this.videoElement = videoElement;

    // Make video element available to scene objects
    if (this.scene) {
      this.scene.videoElement = videoElement;
    }

    if (this.coordinateMapper) {
      this.coordinateMapper.setVideoSource(videoElement);
    }
  }

  /**
   * Initialize game zones
   */
  initializeGameZones() {
    // Upload Zone (Green) - Target
    const uploadZone = new GameZone(this.scene, new Vector3(30, 0, 10), 'upload');
    this.gameZones.push(uploadZone);

    // Glitch Zone (Red) - Hazard
    const glitchZone = new GameZone(this.scene, new Vector3(-30, 5, 10), 'glitch');
    this.gameZones.push(glitchZone);
  }

  /**
   * Main game loop update
   */
  updateGameLoop() {
    // Update object physics/logic
    if (this.objectManager) {
      this.objectManager.update();
    }

    // Check collisions
    this.checkCollisions();
  }

  /**
   * Check collisions between objects and zones
   */
  checkCollisions() {
    if (!this.objectManager || this.gameZones.length === 0) return;

    this.objectManager.objects.forEach((obj, id) => {
      // Only check active objects that are not already interacting?
      // Or continuously check.

      this.gameZones.forEach(zone => {
        if (zone.checkOverlap(obj.mesh)) {
          this.handleZoneInteraction(zone, obj);
        }
      });
    });
  }

  /**
   * Handle interaction between zone and object
   */
  handleZoneInteraction(zone, obj) {
    if (zone.type === 'upload') {
      // If object is released in upload zone? Or just touches?
      // Let's require it to be NOT grabbed to count as upload (drop it in)
      if (!obj.isGrabbed) {
        // Successful upload!
        this.emitGameEvent('UPLOAD', { objectId: obj.id, objectName: obj.name });

        // Visual feedback on object?
        obj.mesh.scaling.scaleInPlace(0.95); // Shrink effect
        if (obj.mesh.scaling.x < 0.1) {
          // Respawn or dispose
          obj.reset();
        }
      }
    } else if (zone.type === 'glitch') {
      // Hazard! Reset immediately
      this.emitGameEvent('GLITCH', { objectId: obj.id });

      obj.velocity = obj.velocity.scale(-1.5); // Bounce back hard
      obj.createCollisionEffect();
    }
  }

  /**
   * Set game event callback
   */
  setGameEventCallback(callback) {
    this.onGameEvent = callback;
  }

  /**
   * Emit game event
   */
  emitGameEvent(type, data) {
    if (this.onGameEvent) {
      this.onGameEvent(type, data);
    }
  }

  /**
   * Get object manager
   */
  getObjectManager() {
    return this.objectManager;
  }

  /**
   * Dispose all resources
   */
  dispose() {
    if (this.isDisposed) return;

    this.isDisposed = true;

    // Stop render loop
    this.stopRenderLoop();

    // Remove event listeners
    if (this.canvas) {
      this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
      this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
    }

    // Dispose scene
    if (this.scene) {
      this.scene.dispose();
      this.scene = null;
    }

    // Dispose engine
    if (this.engine) {
      this.engine.dispose();
      this.engine = null;
    }

    this.isInitialized = false;
    this.onError = null;

    console.log('🗑️ SceneManager disposed successfully');
  }
}

export default SceneManager;
