import {
  MeshBuilder,
  StandardMaterial,
  HDRCubeTexture,
  Texture,
  Color3,
  MirrorTexture,
  Plane
} from "@babylonjs/core";

// Import HDR environment texture


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
      // 1. Digital Night Sky
      this.skybox = MeshBuilder.CreateBox("Skybox", { size: 1000.0 }, this.scene);
      this.skybox.infiniteDistance = true;

      const skyboxMaterial = new StandardMaterial("SkyboxMaterial", this.scene);
      skyboxMaterial.backFaceCulling = false;
      skyboxMaterial.disableLighting = true;
      skyboxMaterial.diffuseColor = Color3.Black();
      skyboxMaterial.specularColor = Color3.Black();
      skyboxMaterial.emissiveColor = Color3.FromHexString("#020205"); // Very dark cyber blue

      this.skybox.material = skyboxMaterial;
      console.log('✅ Cyber Skybox created successfully');

    } catch (error) {
      console.warn('⚠️ Failed to create skybox:', error);
      // Fallback not needed for simple material box
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
   * Create Digital Grid Ground
   */
  createGround() {
    // 1. Main Grid Ground (Simple Wireframe)
    this.ground = MeshBuilder.CreateGround(
      "Ground",
      { width: 500, height: 500, subdivisions: 20 },
      this.scene
    );

    // Grid Material
    const groundMaterial = new StandardMaterial("GroundMaterial", this.scene);
    groundMaterial.diffuseColor = Color3.Black();
    groundMaterial.specularColor = Color3.Black();
    groundMaterial.emissiveColor = Color3.FromHexString("#00FFFF"); // Cyan grid
    groundMaterial.alpha = 0.3;
    groundMaterial.wireframe = true;

    this.ground.material = groundMaterial;
    this.ground.position.y = -20;
    this.ground.checkCollisions = true;

    // 2. Reflection Plane (Cyber "Wet Floor" look)
    const mirrorGround = MeshBuilder.CreateGround("MirrorGround", { width: 500, height: 500 }, this.scene);
    mirrorGround.position.y = -21;

    // Check if MirrorTexture is available (it should be from imports)
    try {
      const mirrorMat = new StandardMaterial("MirrorMat", this.scene);
      mirrorMat.diffuseColor = Color3.Black();
      mirrorMat.specularColor = new Color3(0.5, 0.5, 0.5);
      mirrorMat.reflectionTexture = new MirrorTexture("mirror", 1024, this.scene, true);
      mirrorMat.reflectionTexture.mirrorPlane = new Plane(0, -1, 0, -21);
      if (this.skybox) {
        mirrorMat.reflectionTexture.renderList = [this.skybox];
      }
      mirrorMat.reflectionTexture.level = 0.5;
      mirrorGround.material = mirrorMat;
    } catch (e) {
      console.warn("Mirror texture creation failed", e);
      mirrorGround.dispose();
    }

    // 3. Fog Effect
    // Using standard properties
    this.scene.fogMode = 2; // EXP2
    this.scene.fogDensity = 0.002;
    this.scene.fogColor = Color3.FromHexString("#050510");

    console.log('✅ Digital Grid Environment created');
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
