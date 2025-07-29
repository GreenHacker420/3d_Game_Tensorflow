import {
  Engine,
  Scene,
  Color3,
  Vector3,
  ActionManager
} from "@babylonjs/core";

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
   * Set video element reference for adaptive mapping
   * @param {HTMLVideoElement} videoElement - Video element
   */
  setVideoElement(videoElement) {
    this.videoElement = videoElement;

    // Make video element available to scene objects
    if (this.scene) {
      this.scene.videoElement = videoElement;
    }
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
