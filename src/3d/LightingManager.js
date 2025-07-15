import {
  HemisphericLight,
  DirectionalLight,
  SpotLight,
  ShadowGenerator,
  Vector3,
  Color3
} from "@babylonjs/core";

/**
 * Manages lighting setup for the 3D scene
 */
export class LightingManager {
  constructor(scene) {
    this.scene = scene;
    this.lights = new Map();
    this.shadowGenerators = new Map();
    this.isInitialized = false;
    this.shadowsEnabled = true;
    this.shadowMapSize = 1024;
  }

  /**
   * Initialize default lighting setup
   */
  initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      this.createHemisphericLight();
      this.createDirectionalLight();
      this.createSpotLight();

      if (this.shadowsEnabled) {
        this.setupShadows();
      }

      this.isInitialized = true;
      console.log('✅ Enhanced lighting with shadows initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize lighting:', error);
      throw error;
    }
  }

  /**
   * Create hemispheric (ambient) light
   */
  createHemisphericLight() {
    const light = new HemisphericLight(
      "HemisphericLight", 
      new Vector3(0, 1, 0), 
      this.scene
    );

    // Set light properties
    light.intensity = 0.7;
    light.diffuse = new Color3(1, 1, 1);
    light.specular = new Color3(0.2, 0.2, 0.2);

    this.lights.set('hemispheric', light);
    return light;
  }

  /**
   * Create directional light for shadows and definition
   */
  createDirectionalLight() {
    const light = new DirectionalLight(
      "DirectionalLight",
      new Vector3(-1, -1, -1),
      this.scene
    );

    // Set light properties
    light.intensity = 0.5;
    light.diffuse = new Color3(1, 0.9, 0.8);
    light.specular = new Color3(0.3, 0.3, 0.3);

    this.lights.set('directional', light);
    return light;
  }

  /**
   * Create spot light for enhanced lighting effects
   */
  createSpotLight() {
    const light = new SpotLight(
      "SpotLight",
      new Vector3(10, 20, 10),
      new Vector3(-1, -1, -1),
      Math.PI / 3,
      2,
      this.scene
    );

    // Set light properties
    light.intensity = 0.8;
    light.diffuse = new Color3(1, 1, 0.9);
    light.specular = new Color3(0.5, 0.5, 0.5);

    this.lights.set('spot', light);
    return light;
  }

  /**
   * Setup shadow generation
   */
  setupShadows() {
    const directionalLight = this.lights.get('directional');
    const spotLight = this.lights.get('spot');

    if (directionalLight) {
      const shadowGenerator = new ShadowGenerator(this.shadowMapSize, directionalLight);
      shadowGenerator.useExponentialShadowMap = true;
      shadowGenerator.useKernelBlur = true;
      shadowGenerator.blurKernel = 64;
      shadowGenerator.setDarkness(0.3);

      this.shadowGenerators.set('directional', shadowGenerator);
    }

    if (spotLight) {
      const shadowGenerator = new ShadowGenerator(this.shadowMapSize, spotLight);
      shadowGenerator.useExponentialShadowMap = true;
      shadowGenerator.useKernelBlur = true;
      shadowGenerator.blurKernel = 32;
      shadowGenerator.setDarkness(0.2);

      this.shadowGenerators.set('spot', shadowGenerator);
    }
  }

  /**
   * Add mesh to shadow casting
   * @param {Mesh} mesh - Mesh to cast shadows
   */
  addShadowCaster(mesh) {
    this.shadowGenerators.forEach(generator => {
      generator.addShadowCaster(mesh);
    });
  }

  /**
   * Add mesh to shadow receiving
   * @param {Mesh} mesh - Mesh to receive shadows
   */
  addShadowReceiver(mesh) {
    if (mesh.material) {
      mesh.receiveShadows = true;
    }
  }

  /**
   * Update lighting based on time of day or scene requirements
   * @param {string} preset - Lighting preset ('day', 'night', 'dramatic')
   */
  setLightingPreset(preset) {
    switch (preset) {
      case 'day':
        this.setDayLighting();
        break;
      case 'night':
        this.setNightLighting();
        break;
      case 'dramatic':
        this.setDramaticLighting();
        break;
      default:
        this.setDefaultLighting();
    }
  }

  /**
   * Set day lighting preset
   */
  setDayLighting() {
    const hemispheric = this.lights.get('hemispheric');
    const directional = this.lights.get('directional');

    if (hemispheric) {
      hemispheric.intensity = 0.8;
      hemispheric.diffuse = new Color3(1, 1, 1);
    }

    if (directional) {
      directional.intensity = 0.6;
      directional.diffuse = new Color3(1, 0.95, 0.8);
      directional.direction = new Vector3(-0.5, -1, -0.5);
    }
  }

  /**
   * Set night lighting preset
   */
  setNightLighting() {
    const hemispheric = this.lights.get('hemispheric');
    const directional = this.lights.get('directional');

    if (hemispheric) {
      hemispheric.intensity = 0.3;
      hemispheric.diffuse = new Color3(0.4, 0.4, 0.6);
    }

    if (directional) {
      directional.intensity = 0.2;
      directional.diffuse = new Color3(0.6, 0.6, 0.8);
      directional.direction = new Vector3(-0.3, -1, -0.7);
    }
  }

  /**
   * Set dramatic lighting preset
   */
  setDramaticLighting() {
    const hemispheric = this.lights.get('hemispheric');
    const directional = this.lights.get('directional');

    if (hemispheric) {
      hemispheric.intensity = 0.2;
      hemispheric.diffuse = new Color3(0.3, 0.3, 0.4);
    }

    if (directional) {
      directional.intensity = 0.8;
      directional.diffuse = new Color3(1, 0.8, 0.6);
      directional.direction = new Vector3(-1, -0.5, 0);
    }
  }

  /**
   * Set default lighting preset
   */
  setDefaultLighting() {
    const hemispheric = this.lights.get('hemispheric');
    const directional = this.lights.get('directional');

    if (hemispheric) {
      hemispheric.intensity = 0.7;
      hemispheric.diffuse = new Color3(1, 1, 1);
    }

    if (directional) {
      directional.intensity = 0.5;
      directional.diffuse = new Color3(1, 0.9, 0.8);
      directional.direction = new Vector3(-1, -1, -1);
    }
  }

  /**
   * Set ambient light intensity
   * @param {number} intensity - Light intensity (0-1)
   */
  setAmbientIntensity(intensity) {
    const hemispheric = this.lights.get('hemispheric');
    if (hemispheric) {
      hemispheric.intensity = Math.max(0, Math.min(1, intensity));
    }
  }

  /**
   * Set directional light intensity
   * @param {number} intensity - Light intensity (0-1)
   */
  setDirectionalIntensity(intensity) {
    const directional = this.lights.get('directional');
    if (directional) {
      directional.intensity = Math.max(0, Math.min(1, intensity));
    }
  }

  /**
   * Set directional light direction
   * @param {Vector3} direction - Light direction
   */
  setDirectionalDirection(direction) {
    const directional = this.lights.get('directional');
    if (directional) {
      directional.direction = direction.normalize();
    }
  }

  /**
   * Get light by name
   * @param {string} name - Light name
   * @returns {Light|null} Light instance
   */
  getLight(name) {
    return this.lights.get(name) || null;
  }

  /**
   * Get all lights
   * @returns {Map} Map of all lights
   */
  getAllLights() {
    return new Map(this.lights);
  }

  /**
   * Enable/disable all lights
   * @param {boolean} enabled - Whether to enable lights
   */
  setLightsEnabled(enabled) {
    this.lights.forEach(light => {
      light.setEnabled(enabled);
    });
  }

  /**
   * Dispose all lighting resources
   */
  dispose() {
    this.lights.forEach((light, name) => {
      light.dispose();
      console.log(`🗑️ Light '${name}' disposed`);
    });
    
    this.lights.clear();
    this.isInitialized = false;
    console.log('🗑️ LightingManager disposed');
  }
}

export default LightingManager;
