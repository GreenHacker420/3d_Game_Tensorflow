import * as tf from '@tensorflow/tfjs';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';

export class HandDetectionEngine {
  constructor() {
    this.detector = null;
  }

  async initialize() {
    if (this.detector) return true;

    try {
      console.log("⏳ Loading TensorFlow.js...");
      await tf.ready();
      await tf.setBackend('webgl');
      console.log("✅ TensorFlow.js ready");

      const model = handPoseDetection.SupportedModels.MediaPipeHands;
      const detectorConfig = {
        runtime: 'tfjs', // or 'mediapipe'
        modelType: 'full',
        maxHands: 1
      };

      this.detector = await handPoseDetection.createDetector(model, detectorConfig);
      console.log("✅ HandDetectionEngine initialized");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize HandDetectionEngine:", error);
      return false;
    }
  }

  async detectHands(videoElement) {
    if (!this.detector) return [];
    if (!videoElement || videoElement.readyState !== 4) return [];

    try {
      const hands = await this.detector.estimateHands(videoElement);
      return hands;
    } catch (error) {
      console.warn("⚠️ Detection error:", error);
      return [];
    }
  }
}
