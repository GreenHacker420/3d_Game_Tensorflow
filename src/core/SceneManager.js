import * as BABYLON from '@babylonjs/core';

export class SceneManager {
    constructor() {
        this.engine = null;
        this.scene = null;
    }

    async initialize(canvas) {
        if (!canvas) throw new Error("Canvas is required for SceneManager initialization");

        // Initialize Engine
        this.engine = new BABYLON.Engine(canvas, true);

        // Create Scene
        this.scene = new BABYLON.Scene(this.engine);
        // DEBUG: Bright purple background to confirm rendering
        this.scene.clearColor = new BABYLON.Color4(0.5, 0.2, 0.5, 1);

        // Initial resize to ensure canvas resolution is correct
        this.engine.resize();

        // Create Camera
        // Using UniversalCamera for consistent game view
        this.camera = new BABYLON.UniversalCamera("MainCamera", new BABYLON.Vector3(0, 0, -10), this.scene);
        this.camera.setTarget(BABYLON.Vector3.Zero());

        // Attach controls for debugging (optional, can be removed for game logic later)
        this.camera.attachControl(canvas, true);

        // Create Light
        const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), this.scene);
        light.intensity = 0.7;

        // Create Debug Mesh (Spinning Box)
        this.box = BABYLON.MeshBuilder.CreateBox("debugBox", { size: 1 }, this.scene);
        this.box.position.y = 0;

        // Create Hand Mesh (Sphere)
        this.handMesh = BABYLON.MeshBuilder.CreateSphere("handMesh", { diameter: 0.5 }, this.scene);
        const handMat = new BABYLON.StandardMaterial("handMat", this.scene);
        handMat.emissiveColor = new BABYLON.Color3(0, 1, 1); // Cyan glow
        this.handMesh.material = handMat;
        this.handMesh.position.y = 100; // Hide initially

        // Simple animation loop for the box
        this.scene.registerBeforeRender(() => {
            this.box.rotation.y += 0.01;
            this.box.rotation.x += 0.01;
        });

        // Start Render Loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        // Handle Window Resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });

        console.log("✅ SceneManager initialized");
        return this.scene;
    }

    updateHandPosition(position) {
        if (this.handMesh && position) {
            // Lerp for smoothness
            this.handMesh.position = BABYLON.Vector3.Lerp(this.handMesh.position, position, 0.2);
        }
    }

    dispose() {
        if (this.engine) {
            this.engine.dispose();
        }
    }
}
