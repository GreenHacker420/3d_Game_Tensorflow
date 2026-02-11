import { useRef, useEffect, useState, useCallback } from 'react';
import useGameStore from '../store/gameStore.js';
import SceneManager from '../3d/SceneManager.js';
import CameraController from '../3d/CameraController.js';
import LightingManager from '../3d/LightingManager.js';
import EnvironmentRenderer from '../3d/EnvironmentRenderer.js';
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

      // Setup game events
      sceneManagerRef.current.setGameEventCallback((type, data) => {
        const state = useGameStore.getState();
        if (state.gameState !== 'playing') return;

        switch (type) {
          case 'UPLOAD':
            state.addScore(100);
            console.log(`🚀 Uploaded ${data.objectName}!`);
            break;
          case 'GLITCH':
            state.loseLife();
            console.log('⚠️ Glitch Zone Hit!');
            break;
        }
      });

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
    if (!handState.isTracking || !sceneManagerRef.current) {
      return;
    }

    const objectManager = sceneManagerRef.current.getObjectManager();
    if (objectManager) {
      const handled = objectManager.handleGesture(handState.gesture, handState);
      if (handled) {
        // Update objects info for UI
        const allObjects = objectManager.getAllObjectStatuses();
        setObjectsInfo(allObjects);

        const selected = objectManager.getSelectedObjectStatus();
        setSelectedObject(selected);

        // Update cube info (legacy support for HUD)
        if (selected) {
          setCubeInfo(selected);
        } else if (allObjects.length > 0) {
          setCubeInfo(allObjects[0]);
        }
      }
    }
  }, []);

  /**
   * Reset all objects to initial state
   */
  const resetCube = useCallback(() => {
    const objectManager = sceneManagerRef.current?.getObjectManager();
    if (objectManager) {
      objectManager.resetAll();

      // Update info
      const allObjects = objectManager.getAllObjectStatuses();
      setObjectsInfo(allObjects);

      // Select first object as default if none selected
      if (!selectedObject && allObjects.length > 0) {
        setCubeInfo(allObjects[0]);
      }
    }
  }, [selectedObject]);

  /**
   * Set lighting preset
   */
  const setLightingPreset = useCallback((preset) => {
    if (lightingManagerRef.current) {
      lightingManagerRef.current.setLightingPreset(preset);
    }
  }, []);

  /**
   * Get all interactive objects information
   */
  const getAllObjects = useCallback(() => {
    const objectManager = sceneManagerRef.current?.getObjectManager();
    return objectManager ? objectManager.getAllObjectStatuses() : [];
  }, []);

  /**
   * Get selected object information
   */
  const getSelectedObject = useCallback(() => {
    const objectManager = sceneManagerRef.current?.getObjectManager();
    return objectManager ? objectManager.getSelectedObjectStatus() : null;
  }, []);

  /**
   * Select object by ID
   */
  const selectObject = useCallback((objectId) => {
    const objectManager = sceneManagerRef.current?.getObjectManager();
    if (objectManager) {
      objectManager.selectObject(objectId);
      const selected = objectManager.getSelectedObjectStatus();
      setSelectedObject(selected);
    }
  }, []);

  /**
   * Get gesture compatibility for current selection
   */
  const getGestureCompatibility = useCallback((gesture) => {
    const objectManager = sceneManagerRef.current?.getObjectManager();
    return objectManager ? objectManager.getGestureCompatibility(gesture) : [];
  }, []);

  /**
   * Get cube instance (legacy)
   */
  const getCube = useCallback(() => {
    const objectManager = sceneManagerRef.current?.getObjectManager();
    return objectManager?.selectedObject || null;
  }, []);

  /**
   * Focus camera on selected object
   */
  const focusOnCube = useCallback(() => {
    const objectManager = sceneManagerRef.current?.getObjectManager();
    if (cameraControllerRef.current && objectManager) {
      const selected = objectManager.selectedObject;
      if (selected && selected.getMesh()) {
        cameraControllerRef.current.focusOnTarget(selected.getMesh().position);
      }
    }
  }, []);

  // Reset camera to default position
  const resetCamera = useCallback(() => {
    if (cameraControllerRef.current) {
      cameraControllerRef.current.resetToDefault();
    }
  }, []);

  /**
   * Get performance info
   */
  const getPerformanceInfo = useCallback(() => {
    return sceneManagerRef.current ? sceneManagerRef.current.getPerformanceInfo() : { fps: 0, deltaTime: 0 };
  }, []);

  /**
   * Get scene instance
   */
  const getScene = useCallback(() => {
    return sceneManagerRef.current ? sceneManagerRef.current.getScene() : null;
  }, []);

  /**
   * Manual resize trigger
   */
  const resize = useCallback(() => {
    if (sceneManagerRef.current && sceneManagerRef.current.engine) {
      sceneManagerRef.current.engine.resize();
    }
    if (sceneManagerRef.current && sceneManagerRef.current.coordinateMapper) {
      sceneManagerRef.current.coordinateMapper.resize();
    }
  }, []);

  /**
   * Set adaptive mapper
   */
  const setAdaptiveMapper = useCallback((mapper) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setAdaptiveMapper(mapper);
    }
  }, []);

  /**
   * Set video element for mapping
   */
  const setVideoElement = useCallback((video) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setVideoElement(video);
    }
  }, []);

  // Dispose scene on unmount
  useEffect(() => {
    return () => {
      // Dispose in reverse order
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
    environmentRenderer: environmentRendererRef.current
  };
};

export default use3DScene;
