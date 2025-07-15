import { useRef, useEffect, useState, useCallback } from 'react';
import SceneManager from '../3d/SceneManager.js';
import CameraController from '../3d/CameraController.js';
import LightingManager from '../3d/LightingManager.js';
import EnvironmentRenderer from '../3d/EnvironmentRenderer.js';
import InteractiveCube from '../objects/InteractiveCube.js';

/**
 * React hook for 3D scene management
 */
export const use3DScene = (canvasRef) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cubeInfo, setCubeInfo] = useState(null);

  // Refs for 3D components
  const sceneManagerRef = useRef(null);
  const cameraControllerRef = useRef(null);
  const lightingManagerRef = useRef(null);
  const environmentRendererRef = useRef(null);
  const interactiveCubeRef = useRef(null);

  /**
   * Initialize 3D scene
   */
  const initialize = useCallback(async () => {
    if (isInitialized || isLoading || !canvasRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Initialize scene manager
      sceneManagerRef.current = new SceneManager(canvasRef.current);
      sceneManagerRef.current.setErrorCallback(setError);
      
      const scene = await sceneManagerRef.current.initialize();

      // Initialize camera
      cameraControllerRef.current = new CameraController(scene);
      cameraControllerRef.current.initialize(canvasRef.current);

      // Initialize lighting
      lightingManagerRef.current = new LightingManager(scene);
      lightingManagerRef.current.initialize();

      // Initialize environment
      environmentRendererRef.current = new EnvironmentRenderer(scene);
      await environmentRendererRef.current.initialize();

      // Initialize interactive cube
      interactiveCubeRef.current = new InteractiveCube(scene);
      interactiveCubeRef.current.initialize();

      // Start render loop
      sceneManagerRef.current.startRenderLoop();

      setIsInitialized(true);
      console.log('✅ 3D Scene initialized successfully');

    } catch (err) {
      setError(err.message);
      console.error('❌ Failed to initialize 3D scene:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, isLoading, canvasRef]);

  /**
   * Update cube with hand gesture
   */
  const updateCubeWithHand = useCallback((handState, use3DMode = false) => {
    if (!interactiveCubeRef.current || !handState.isTracking) {
      return;
    }

    // Handle gesture interaction with 3D mode support
    interactiveCubeRef.current.handleGesture(handState.gesture, handState, use3DMode);

    // Update cube info for UI
    const info = interactiveCubeRef.current.getInfo();
    setCubeInfo(info);
  }, []);

  /**
   * Reset cube to initial state
   */
  const resetCube = useCallback(() => {
    if (interactiveCubeRef.current) {
      interactiveCubeRef.current.reset();
      setCubeInfo(interactiveCubeRef.current.getInfo());
    }
  }, []);

  /**
   * Set lighting preset
   */
  const setLightingPreset = useCallback((preset) => {
    if (lightingManagerRef.current) {
      lightingManagerRef.current.setLightingPreset(preset);
    }
    if (environmentRendererRef.current) {
      environmentRendererRef.current.setEnvironmentPreset(preset);
    }
  }, []);

  /**
   * Focus camera on cube
   */
  const focusOnCube = useCallback(() => {
    if (cameraControllerRef.current && interactiveCubeRef.current) {
      const cubeMesh = interactiveCubeRef.current.getMesh();
      if (cubeMesh) {
        cameraControllerRef.current.focusOnTarget(cubeMesh.position);
      }
    }
  }, []);

  /**
   * Reset camera to default position
   */
  const resetCamera = useCallback(() => {
    if (cameraControllerRef.current) {
      cameraControllerRef.current.resetToDefault();
    }
  }, []);

  /**
   * Get scene performance info
   */
  const getPerformanceInfo = useCallback(() => {
    return sceneManagerRef.current?.getPerformanceInfo() || { fps: 0, deltaTime: 0 };
  }, []);

  /**
   * Get scene instance
   */
  const getScene = useCallback(() => {
    return sceneManagerRef.current?.getScene() || null;
  }, []);

  /**
   * Get cube instance
   */
  const getCube = useCallback(() => {
    return interactiveCubeRef.current || null;
  }, []);

  /**
   * Resize scene
   */
  const resize = useCallback(() => {
    if (sceneManagerRef.current) {
      const engine = sceneManagerRef.current.getEngine();
      if (engine) {
        engine.resize();
      }
    }
  }, []);

  /**
   * Initialize scene when canvas is ready
   */
  useEffect(() => {
    if (canvasRef.current && !isInitialized && !isLoading) {
      initialize();
    }
  }, [initialize, isInitialized, isLoading]);

  /**
   * Handle window resize
   */
  useEffect(() => {
    const handleResize = () => {
      resize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resize]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Dispose in reverse order
      if (interactiveCubeRef.current) {
        interactiveCubeRef.current.dispose();
      }
      if (environmentRendererRef.current) {
        environmentRendererRef.current.dispose();
      }
      if (lightingManagerRef.current) {
        lightingManagerRef.current.dispose();
      }
      if (cameraControllerRef.current) {
        cameraControllerRef.current.dispose();
      }
      if (sceneManagerRef.current) {
        sceneManagerRef.current.dispose();
      }
    };
  }, []);

  return {
    // State
    isInitialized,
    isLoading,
    error,
    cubeInfo,
    
    // Methods
    initialize,
    updateCubeWithHand,
    resetCube,
    setLightingPreset,
    focusOnCube,
    resetCamera,
    getPerformanceInfo,
    getScene,
    getCube,
    resize,
    
    // Scene components (for advanced usage)
    sceneManager: sceneManagerRef.current,
    cameraController: cameraControllerRef.current,
    lightingManager: lightingManagerRef.current,
    environmentRenderer: environmentRendererRef.current,
    interactiveCube: interactiveCubeRef.current
  };
};

export default use3DScene;
