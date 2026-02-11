import * as tf from '@tensorflow/tfjs';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';

export class HandDetectionEngine {
  constructor() {
    this.detector = null;
  }

  async initialize() {
    // TODO: Load model
  }
}
