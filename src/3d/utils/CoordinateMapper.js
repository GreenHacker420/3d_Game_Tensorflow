import { Vector3, Matrix } from "@babylonjs/core";

export class CoordinateMapper {
    constructor(scene) {
        this.scene = scene;

        this.videoElement = null;

        this.inputResolution = { width: 640, height: 480 };
        this.screenResolution = { width: 1, height: 1 };

        this.depthScale = 0.4;     // depth sensitivity
        this.baseDepth = 50.0;      // Distance to Z=0 plane (approx)

        this.mirrorX = true;       // webcam mirror toggle
    }

    setVideoSource(video) {
        this.videoElement = video;
        this.inputResolution.width = video.videoWidth || 640;
        this.inputResolution.height = video.videoHeight || 480;
    }

    resize() {
        const engine = this.scene?.getEngine();
        if (!engine) return;

        this.screenResolution.width = engine.getRenderWidth();
        this.screenResolution.height = engine.getRenderHeight();
    }

    map(hand, targetDepth = null) {
        const camera = this.scene.activeCamera;
        if (!camera) return Vector3.Zero();

        /* -----------------------------
         * 1. Normalize video → NDC
         * ----------------------------- */
        let x = hand.x / this.inputResolution.width;
        let y = hand.y / this.inputResolution.height;

        if (this.mirrorX) x = 1 - x;

        const ndcX = x * 2 - 1;
        const ndcY = -(y * 2 - 1);

        /* -----------------------------
         * 2. Create camera ray
         * ----------------------------- */
        const screenX = (ndcX * 0.5 + 0.5) * this.screenResolution.width;
        const screenY = (ndcY * -0.5 + 0.5) * this.screenResolution.height;

        const ray = this.scene.createPickingRay(
            screenX,
            screenY,
            Matrix.Identity(),
            camera
        );

        /* -----------------------------
         * 3. Depth along ray
         * ----------------------------- */
        const depth = targetDepth !== null
            ? targetDepth
            : this.baseDepth + (hand.z ?? 0) * this.depthScale;

        return ray.origin.add(ray.direction.scale(depth));
    }
}
