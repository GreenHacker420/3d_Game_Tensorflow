import * as BABYLON from '@babylonjs/core';

export class CoordinateMapper {
    constructor(scene, videoWidth = 640, videoHeight = 480) {
        this.scene = scene;
        this.videoWidth = videoWidth;
        this.videoHeight = videoHeight;
        this.camera = scene.activeCamera;

        // Configuration
        this.depthScale = 10; // How much Z-movement for hand depth
        this.baseZ = 0; // The Z-plane where interaction happens
    }

    /**
     * Maps 2D video coordinates to 3D world coordinates
     * @param {number} x - Video X coordinate
     * @param {number} y - Video Y coordinate
     * @param {number} depth - Normalized depth (0-1) from hand size
     * @returns {BABYLON.Vector3} 3D World Position
     */
    mapToWorld(x, y, depth = 0) {
        if (!this.camera) return BABYLON.Vector3.Zero();

        // 1. Normalize coordinates (-1 to 1)
        // Flip X because webcam is mirrored
        const ndcX = -1 * ((x / this.videoWidth) * 2 - 1);
        const ndcY = -1 * ((y / this.videoHeight) * 2 - 1);

        // 2. Determine Z-depth
        // We want the hand to move on a plane, but also allow some Z-depth movement
        // Let's unproject to a fixed interaction plane first

        // Create a viewport vector at the near plane
        const source = new BABYLON.Vector3(ndcX, ndcY, 0.5); // 0.5 is arbitrary clip space depth

        // Unproject to world space
        const worldRay = BABYLON.Ray.CreateNewFromTo(
            this.camera.position,
            BABYLON.Vector3.Unproject(
                source,
                this.engine.getRenderWidth(),
                this.engine.getRenderHeight(),
                BABYLON.Matrix.Identity(),
                this.scene.getViewMatrix(),
                this.scene.getProjectionMatrix()
            )
        );

        // Calculate intersection with Z = 0 plane (or baseZ)
        // Ray: Origin + Direction * t = Target
        // Origin.z + Direction.z * t = baseZ
        // t = (baseZ - Origin.z) / Direction.z

        const direction = worldRay.direction;
        const origin = worldRay.origin;

        // Avoid division by zero
        if (Math.abs(direction.z) < 0.0001) return new BABYLON.Vector3(0, 0, 0);

        const t = (this.baseZ - origin.z) / direction.z;

        const hit = origin.add(direction.scale(t));

        // Add optional depth offset based on hand gesture (moving closer/further)
        // This is a simple Z-offset for now
        hit.z += depth * this.depthScale;

        return hit;
    }

    updateDimensions(width, height) {
        this.videoWidth = width;
        this.videoHeight = height;
    }

    get engine() {
        return this.scene.getEngine();
    }
}
