import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['@tensorflow/tfjs', '@tensorflow-models/hand-pose-detection', '@mediapipe/hands'],
  webpack: (config) => {
    // Fix for MediaPipe/TensorFlow ESM issues
    config.resolve.alias = {
      ...config.resolve.alias,
      '@mediapipe/hands': '@mediapipe/hands/hands.js',
    };
    return config;
  },
  reactCompiler: true,
};

export default nextConfig;
