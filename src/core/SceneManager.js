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
        this.scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.2, 1); // Dark blue-ish background

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
        const box = BABYLON.MeshBuilder.CreateBox("debugBox", { size: 1 }, this.scene);
        box.position.y = 0;

        // Simple animation loop for the box
        this.scene.registerBeforeRender(() => {
            box.rotation.y += 0.01;
            box.rotation.x += 0.01;
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

    dispose() {
        if (this.engine) {
            this.engine.dispose();
        }
    }
}
