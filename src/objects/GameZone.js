import {
    MeshBuilder,
    StandardMaterial,
    Color3,
    Animation,
    Vector3,
    ParticleSystem,
    Texture
} from "@babylonjs/core";
import { CyberMaterial } from '../3d/materials/CyberMaterial.js';

/**
 * GameZone: Interactive zones for gameplay (Upload, Glitch)
 */
export class GameZone {
    constructor(scene, position, type = 'upload') {
        this.scene = scene;
        this.position = position;
        this.type = type; // 'upload' | 'glitch'
        this.mesh = null;
        this.material = null;
        this.particles = null;

        this.initialize();
    }

    initialize() {
        if (this.type === 'upload') {
            this.createUploadZone();
        } else {
            this.createGlitchZone();
        }
    }

    createUploadZone() {
        // Green data pillar
        this.mesh = MeshBuilder.CreateCylinder("UploadZone", {
            diameter: 15,
            height: 40,
            tessellation: 16
        }, this.scene);
        this.mesh.position = this.position;
        this.mesh.checkCollisions = true;

        // Material
        this.material = new StandardMaterial("UploadMat", this.scene);
        this.material.diffuseColor = Color3.Green();
        this.material.emissiveColor = Color3.FromHexString("#00FF00");
        this.material.alpha = 0.3;
        this.mesh.material = this.material;

        // Pulse Animation
        this.setupPulseAnimation();
    }

    createGlitchZone() {
        // Red hazard sphere
        this.mesh = MeshBuilder.CreateSphere("GlitchZone", {
            diameter: 12
        }, this.scene);
        this.mesh.position = this.position;

        // Material
        this.material = new StandardMaterial("GlitchMat", this.scene);
        this.material.diffuseColor = Color3.Red();
        this.material.emissiveColor = Color3.Red();
        this.material.alpha = 0.5;
        this.material.wireframe = true;
        this.mesh.material = this.material;

        // Rotate Animation
        this.scene.registerBeforeRender(() => {
            if (this.mesh) {
                this.mesh.rotation.y += 0.02;
                this.mesh.rotation.x += 0.01;
            }
        });
    }

    setupPulseAnimation() {
        const animation = new Animation(
            "zonePulse",
            "material.alpha",
            30,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_YOYO
        );

        const keys = [];
        keys.push({ frame: 0, value: 0.2 });
        keys.push({ frame: 30, value: 0.5 });
        keys.push({ frame: 60, value: 0.2 });

        animation.setKeys(keys);
        this.mesh.animations = [animation];
        this.scene.beginAnimation(this.mesh, 0, 60, true);
    }

    /**
     * Check if an object overlaps with this zone
     * @param {Mesh} otherMesh 
     */
    checkOverlap(otherMesh) {
        if (!this.mesh || !otherMesh) return false;
        return this.mesh.intersectsMesh(otherMesh, true);
    }

    dispose() {
        if (this.mesh) {
            this.mesh.dispose();
        }
        if (this.material) {
            this.material.dispose();
        }
        if (this.particles) {
            this.particles.dispose();
        }
    }
}

export default GameZone;
