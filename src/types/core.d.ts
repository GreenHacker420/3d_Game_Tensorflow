declare module '@/core/SceneManager' {
    import * as BABYLON from '@babylonjs/core';
    export class SceneManager {
        scene: BABYLON.Scene;
        initialize(canvas: HTMLCanvasElement): Promise<BABYLON.Scene>;
        updateHandPosition(position: BABYLON.Vector3): void;
        dispose(): void;
    }
}

declare module '@/core/HandDetectionEngine' {
    export class HandDetectionEngine {
        initialize(): Promise<boolean>;
        detectHands(video: HTMLVideoElement): Promise<any[]>;
    }
}

declare module '@/core/CoordinateMapper' {
    import * as BABYLON from '@babylonjs/core';
    export class CoordinateMapper {
        constructor(scene: BABYLON.Scene, videoWidth: number, videoHeight: number);
        mapToWorld(x: number, y: number, depth?: number): BABYLON.Vector3;
        updateDimensions(width: number, height: number): void;
    }
}
