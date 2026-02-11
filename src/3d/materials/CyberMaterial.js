import { PBRMaterial, Texture, Color3, Vector3 } from "@babylonjs/core";

/**
 * Factory for creating Cyberpunk-themed materials
 */
export class CyberMaterial {
    /**
     * Create a neon PBR material
     * @param {string} name - Material name
     * @param {Scene} scene - Babylon.js scene
     * @param {Color3} color - Base color
     * @param {number} intensity - Emissive intensity
     */
    static CreateNeon(name, scene, color, intensity = 1.0) {
        const material = new PBRMaterial(name, scene);

        // PBR properties for a sleek, metallic look
        material.albedoColor = color;
        material.metallic = 0.8;
        material.roughness = 0.2;

        // Emissive properties for the neon glow
        material.emissiveColor = color;
        material.emissiveIntensity = intensity;

        // Fresnel effect for rim lighting
        material.enableFresnel = true;
        material.emissiveFresnelParameters = {
            bias: 0.1,
            power: 2,
            leftColor: Color3.Black(),
            rightColor: color
        };

        return material;
    }

    /**
     * Create a grid material for the floor/environment
     * @param {string} name - Material name
     * @param {Scene} scene - Babylon.js scene
     */
    static CreateGrid(name, scene) {
        const material = new PBRMaterial(name, scene);

        material.albedoColor = Color3.FromHexString("#050510");
        material.metallic = 0.9;
        material.roughness = 0.1;

        // Create a procedural grid texture (or load one if available)
        // For now, we'll try to use a noise texture or just base color
        // In a real app, we'd load a grid texture. Let's simulate it with emissive texture if possible,
        // or just keep it simple dark reflective for now.

        material.emissiveColor = Color3.FromHexString("#00FFFF");
        material.emissiveIntensity = 0.1;

        return material;
    }

    /**
     * Create a holographic material (semi-transparent)
     * @param {string} name - Material name
     * @param {Scene} scene - Babylon.js scene
     * @param {Color3} color - Hologram color
     */
    static CreateHologram(name, scene, color) {
        const material = new PBRMaterial(name, scene);

        material.albedoColor = color;
        material.alpha = 0.4;
        material.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;

        material.metallic = 0.0;
        material.roughness = 1.0;

        material.emissiveColor = color;
        material.emissiveIntensity = 0.8;

        // Wireframe for that "virtual" look
        material.wireframe = true;

        return material;
    }
}
