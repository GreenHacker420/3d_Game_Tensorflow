import { useRef, useEffect, useState, useCallback } from 'react';
import SceneManager from '../3d/SceneManager.js';
import CameraController from '../3d/CameraController.js';
import LightingManager from '../3d/LightingManager.js';
import EnvironmentRenderer from '../3d/EnvironmentRenderer.js';
import InteractiveCube from '../objects/InteractiveCube.js';
import { ObjectManager } from '../utils/ObjectManager.js';

/**
 * React hook for 3D scene management
 */
export const use3DScene = (canvasRef) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cubeInfo, setCubeInfo] = useState(null);
  const [objectsInfo, setObjectsInfo] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);

  // Refs for 3D components
  const sceneManagerRef = useRef(null);
  const cameraControllerRef = useRef(null);
  const lightingManagerRef = useRef(null);
  const environmentRendererRef = useRef(null);
  const interactiveCubeRef = useRef(null);
  const objectManagerRef = useRef(null);

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
      console.log('🎬 Initializing 3D scene manager...');
      // Initialize scene manager
      sceneManagerRef.current = new SceneManager(canvasRef.current);
      sceneManagerRef.current.setErrorCallback(setError);

      console.log('🎬 Loading 3D scene...');
      const scene = await sceneManagerRef.current.initialize();
      console.log('✅ 3D scene loaded');

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

      // Initialize object manager for multi-object interactions
      objectManagerRef.current = new ObjectManager(scene);
      console.log('✅ ObjectManager initialized with multiple interactive objects');

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
   * Update objects with hand gesture (supports both single cube and multi-object modes)
   */
  const updateCubeWithHand = useCallback((handState, use3DMode = false) => {
    if (!handState.isTracking) {
      return;
    }

    // Try ObjectManager first for multi-object interactions
    if (objectManagerRef.current) {
      const handled = objectManagerRef.current.handleGesture(handState.gesture, handState);
      if (handled) {
        // Update objects info for UI
        const allObjects = objectManagerRef.current.getAllObjectStatuses();
        setObjectsInfo(allObjects);

        const selected = objectManagerRef.current.getSelectedObjectStatus();
        setSelectedObject(selected);

        // Also update cube info for backward compatibility
        if (interactiveCubeRef.current) {
          const cubeInfo = interactiveCubeRef.current.getInfo();
          setCubeInfo(cubeInfo);
        }
        return;
      }
    }

    // Fallback to single cube interaction
    if (interactiveCubeRef.current) {
      interactiveCubeRef.current.handleGesture(handState.gesture, handState, use3DMode);
      const info = interactiveCubeRef.current.getInfo();
      setCubeInfo(info);
    }
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
   * Get all interactive objects information
   */
  const getAllObjects = useCallback(() => {
    return objectManagerRef.current ? objectManagerRef.current.getAllObjectStatuses() : [];
  }, []);

  /**
   * Get selected object information
   */
  const getSelectedObject = useCallback(() => {
    return objectManagerRef.current ? objectManagerRef.current.getSelectedObjectStatus() : null;
  }, []);

  /**
   * Select object by ID
   */
  const selectObject = useCallback((objectId) => {
    if (objectManagerRef.current) {
      objectManagerRef.current.selectObject(objectId);
      const selected = objectManagerRef.current.getSelectedObjectStatus();
      setSelectedObject(selected);
    }
  }, []);

  /**
   * Get gesture compatibility for current selection
   */
  const getGestureCompatibility = useCallback((gesture) => {
    return objectManagerRef.current ? objectManagerRef.current.getGestureCompatibility(gesture) : [];
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
   * Set adaptive mapper for the scene
   * @param {Object} adaptiveMapper - Adaptive mapper instance
   */
  const setAdaptiveMapper = useCallback((adaptiveMapper) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setAdaptiveMapper(adaptiveMapper);
    }
  }, []);

  /**
   * Set video element for adaptive mapping
   * @param {HTMLVideoElement} videoElement - Video element
   */
  const setVideoElement = useCallback((videoElement) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setVideoElement(videoElement);
    }
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
    objectsInfo,
    selectedObject,

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

    // Multi-object methods
    getAllObjects,
    getSelectedObject,
    selectObject,
    getGestureCompatibility,

    // Adaptive mapping methods
    setAdaptiveMapper,
    setVideoElement,

    // Scene components (for advanced usage)
    sceneManager: sceneManagerRef.current,
    cameraController: cameraControllerRef.current,
    lightingManager: lightingManagerRef.current,
    environmentRenderer: environmentRendererRef.current,
    interactiveCube: interactiveCubeRef.current,
    objectManager: objectManagerRef.current
  };
};

export default use3DScene;
