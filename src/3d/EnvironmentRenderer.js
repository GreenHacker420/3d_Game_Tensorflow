import {
  MeshBuilder,
  StandardMaterial,
  HDRCubeTexture,
  Texture,
  Color3
} from "@babylonjs/core";

// Import HDR environment texture
import moonlitGolfHDRUrl from '../utils/moonlit_golf_2k.hdr?url';

/**
 * Manages environment rendering including skybox and ground
 */
export class EnvironmentRenderer {
  constructor(scene) {
    this.scene = scene;
    this.skybox = null;
    this.ground = null;
    this.isInitialized = false;
  }

  /**
   * Initialize environment rendering
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.createSkybox();
      this.createGround();
      
      this.isInitialized = true;
      console.log('✅ Environment initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize environment:', error);
      throw error;
    }
  }

  /**
   * Create skybox with HDR environment texture
   */
  async createSkybox() {
    try {
      // Create skybox mesh
      this.skybox = MeshBuilder.CreateBox("Skybox", { size: 300.0 }, this.scene);
      this.skybox.infiniteDistance = true;

      // Create skybox material
      const skyboxMaterial = new StandardMaterial("SkyboxMaterial", this.scene);
      skyboxMaterial.backFaceCulling = false;
      skyboxMaterial.disableLighting = true;

      // Load HDR texture
      const hdrTexture = new HDRCubeTexture(
        moonlitGolfHDRUrl, 
        this.scene, 
        512, 
        false, 
        true, 
        false, 
        true
      );

      hdrTexture.coordinatesMode = Texture.SKYBOX_MODE;
      skyboxMaterial.reflectionTexture = hdrTexture;

      // Apply material to skybox
      this.skybox.material = skyboxMaterial;

      console.log('✅ Skybox created successfully');

    } catch (error) {
      console.warn('⚠️ Failed to load HDR skybox, using fallback:', error);
      this.createFallbackSkybox();
    }
  }

  /**
   * Create fallback skybox with gradient colors
   */
  createFallbackSkybox() {
    if (this.skybox) {
      this.skybox.dispose();
    }

    // Create simple gradient skybox
    this.skybox = MeshBuilder.CreateBox("FallbackSkybox", { size: 300.0 }, this.scene);
    this.skybox.infiniteDistance = true;

    const skyboxMaterial = new StandardMaterial("FallbackSkyboxMaterial", this.scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;
    skyboxMaterial.diffuseColor = new Color3(0.2, 0.3, 0.5);
    skyboxMaterial.emissiveColor = new Color3(0.1, 0.15, 0.25);

    this.skybox.material = skyboxMaterial;
    console.log('✅ Fallback skybox created');
  }

  /**
   * Create ground plane
   */
  createGround() {
    // Create ground mesh
    this.ground = MeshBuilder.CreateGround(
      "Ground", 
      { width: 200, height: 200 }, 
      this.scene
    );

    // Create ground material
    const groundMaterial = new StandardMaterial("GroundMaterial", this.scene);
    groundMaterial.diffuseColor = new Color3(0.3, 0.3, 0.3);
    groundMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    groundMaterial.roughness = 0.8;

    // Apply material
    this.ground.material = groundMaterial;

    // Position ground
    this.ground.position.y = -20;

    // Enable collisions
    this.ground.checkCollisions = true;

    console.log('✅ Ground created successfully');
  }

  /**
   * Update environment based on lighting preset
   * @param {string} preset - Environment preset ('day', 'night', 'dramatic')
   */
  setEnvironmentPreset(preset) {
    switch (preset) {
      case 'day':
        this.setDayEnvironment();
        break;
      case 'night':
        this.setNightEnvironment();
        break;
      case 'dramatic':
        this.setDramaticEnvironment();
        break;
      default:
        this.setDefaultEnvironment();
    }
  }

  /**
   * Set day environment colors
   */
  setDayEnvironment() {
    if (this.ground && this.ground.material) {
      this.ground.material.diffuseColor = new Color3(0.4, 0.4, 0.4);
      this.ground.material.emissiveColor = new Color3(0.05, 0.05, 0.05);
    }

    // Update scene clear color
    this.scene.clearColor = Color3.FromHexString("#87CEEB");
  }

  /**
   * Set night environment colors
   */
  setNightEnvironment() {
    if (this.ground && this.ground.material) {
      this.ground.material.diffuseColor = new Color3(0.1, 0.1, 0.15);
      this.ground.material.emissiveColor = new Color3(0.02, 0.02, 0.03);
    }

    // Update scene clear color
    this.scene.clearColor = Color3.FromHexString("#0a0a1a");
  }

  /**
   * Set dramatic environment colors
   */
  setDramaticEnvironment() {
    if (this.ground && this.ground.material) {
      this.ground.material.diffuseColor = new Color3(0.2, 0.15, 0.1);
      this.ground.material.emissiveColor = new Color3(0.03, 0.02, 0.01);
    }

    // Update scene clear color
    this.scene.clearColor = Color3.FromHexString("#2a1a0a");
  }

  /**
   * Set default environment colors
   */
  setDefaultEnvironment() {
    if (this.ground && this.ground.material) {
      this.ground.material.diffuseColor = new Color3(0.3, 0.3, 0.3);
      this.ground.material.emissiveColor = new Color3(0, 0, 0);
    }

    // Update scene clear color
    this.scene.clearColor = Color3.FromHexString("#1a1a1a");
  }

  /**
   * Show/hide ground
   * @param {boolean} visible - Whether ground should be visible
   */
  setGroundVisible(visible) {
    if (this.ground) {
      this.ground.setEnabled(visible);
    }
  }

  /**
   * Show/hide skybox
   * @param {boolean} visible - Whether skybox should be visible
   */
  setSkyboxVisible(visible) {
    if (this.skybox) {
      this.skybox.setEnabled(visible);
    }
  }

  /**
   * Get skybox mesh
   * @returns {Mesh|null} Skybox mesh
   */
  getSkybox() {
    return this.skybox;
  }

  /**
   * Get ground mesh
   * @returns {Mesh|null} Ground mesh
   */
  getGround() {
    return this.ground;
  }

  /**
   * Dispose environment resources
   */
  dispose() {
    if (this.skybox) {
      this.skybox.dispose();
      this.skybox = null;
    }

    if (this.ground) {
      this.ground.dispose();
      this.ground = null;
    }

    this.isInitialized = false;
    console.log('🗑️ EnvironmentRenderer disposed');
  }
}

export default EnvironmentRenderer;
