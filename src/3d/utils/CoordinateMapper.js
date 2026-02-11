import { Vector3, Matrix, Viewport } from "@babylonjs/core";

/**
 * Handles robust mapping of 2D screen/video coordinates to 3D world space
 */
export class CoordinateMapper {
    constructor(scene) {
        this.scene = scene;
        this.videoElement = null;
        this.depthScale = 20.0; // Scale factor for Z-depth
        this.inputResolution = { width: 640, height: 480 }; // Default video resolution
        this.screenResolution = { width: window.innerWidth, height: window.innerHeight };
    }

    /**
     * Set the video element size for normalization
     * @param {HTMLVideoElement} video 
     */
    setVideoSource(video) {
        this.videoElement = video;
        this.inputResolution.width = video.videoWidth || 640;
        this.inputResolution.height = video.videoHeight || 480;
    }

    /**
     * Update screen resolution (call on resize)
     */
    resize() {
        if (this.scene && this.scene.getEngine()) {
            this.screenResolution.width = this.scene.getEngine().getRenderWidth();
            this.screenResolution.height = this.scene.getEngine().getRenderHeight();
        }
    }

    /**
     * Map 2D hand coordinates to 3D world position
     * @param {Object} handPosition - { x, y, z } from HandDetectionEngine
     * @param {number} targetDepth - Optional fixed depth (distance from camera)
     * @returns {Vector3} World position
     */
    map(handPosition, targetDepth = null) {
        if (!this.scene.activeCamera) {
            return Vector3.Zero();
        }

        // 1. Normalize 2D coordinates [-1, 1]
        // Hand coordinates are usually [0, width] and [0, height]
        // We assume input is mirror-flipped relative to screen if it's webcam, 
        // but the engine might already handle that.
        // Usually, x=0 is left, but webcam is often mirrored.

        const normalizedX = (handPosition.x / this.inputResolution.width) * 2 - 1;
        const normalizedY = -((handPosition.y / this.inputResolution.height) * 2 - 1); // Flip Y for 3D space

        // 2. Determine Depth
        // handPosition.z is usually normalized [0, 1] or similar from the engine
        // We map this to a distance from the camera
        const zDistance = targetDepth !== null
            ? targetDepth
            : 10 + (handPosition.z || 0) * this.depthScale;

        // 3. Unproject
        // We want to find the point in world space that corresponds to (normalizedX, normalizedY) at distance zDistance

        // Create a point on the near plane? No, we can use Unproject.
        // Actually, simple unproject with depth is tricky.
        // Alternative: Create a ray and scale it.

        const identity = Matrix.Identity();
        const viewport = new Viewport(0, 0, 1, 1);

        // Unproject expects screen coordinates in pixels? No, depends on implementation.
        // Babylon Vector3.Unproject parameters:
        // source (Vector3), viewportWidth, viewportHeight, world, view, projection

        // Let's use scene.pickWithRay or scene.createPickingRay if we want to hit a plane.
        // But we want "air" control.

        // Simplified robust approach:
        // Project (normalizedX, normalizedY) onto a plane at `zDistance` from camera.

        const ray = this.scene.createPickingRay(
            handPosition.x * (this.screenResolution.width / this.inputResolution.width),
            handPosition.y * (this.screenResolution.height / this.inputResolution.height),
            Matrix.Identity(),
            this.scene.activeCamera
        );

        // Get point along the ray at zDistance
        if (ray) {
            return ray.origin.add(ray.direction.scale(zDistance));
        }

        return Vector3.Zero();
    }
}
