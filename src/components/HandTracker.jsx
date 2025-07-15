import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import Webcam from 'react-webcam';

/**
 * Minimalistic hand tracking component with webcam and overlay canvas
 */
const HandTracker = ({ 
  onHandDetection, 
  isLoading, 
  error,
  className = '',
  width = 640,
  height = 480
}) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  /**
   * Draw hand landmarks on canvas
   */
  const drawHandLandmarks = (landmarks) => {
    if (!canvasRef.current || !landmarks) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set drawing style
    ctx.strokeStyle = '#00ff00';
    ctx.fillStyle = '#00ff00';
    ctx.lineWidth = 2;

    // Draw landmarks as small circles
    landmarks.forEach((landmark, index) => {
      const x = landmark[0];
      const y = landmark[1];
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw landmark number for key points
      if ([0, 4, 8, 12, 16, 20].includes(index)) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.fillText(index.toString(), x + 5, y - 5);
        ctx.fillStyle = '#00ff00';
      }
    });

    // Draw connections between landmarks
    const connections = [
      // Thumb
      [0, 1], [1, 2], [2, 3], [3, 4],
      // Index finger
      [0, 5], [5, 6], [6, 7], [7, 8],
      // Middle finger
      [0, 9], [9, 10], [10, 11], [11, 12],
      // Ring finger
      [0, 13], [13, 14], [14, 15], [15, 16],
      // Pinky
      [0, 17], [17, 18], [18, 19], [19, 20]
    ];

    ctx.strokeStyle = '#00ff0080';
    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      
      ctx.beginPath();
      ctx.moveTo(startPoint[0], startPoint[1]);
      ctx.lineTo(endPoint[0], endPoint[1]);
      ctx.stroke();
    });
  };

  /**
   * Update canvas size to match video
   */
  const updateCanvasSize = () => {
    if (webcamRef.current && canvasRef.current) {
      const video = webcamRef.current.video;
      if (video && video.videoWidth && video.videoHeight) {
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
      }
    }
  };

  /**
   * Handle webcam ready
   */
  const handleWebcamReady = () => {
    updateCanvasSize();

    if (onHandDetection && webcamRef.current) {
      // Pass the webcam ref object, not the current value
      onHandDetection(webcamRef);
    }
  };

  /**
   * Update canvas size when video loads
   */
  useEffect(() => {
    const video = webcamRef.current?.video;
    if (video) {
      const handleLoadedMetadata = () => {
        updateCanvasSize();
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }
  }, []);

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="overlay glow-accent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="overlay-content">
              <motion.div
                className="spinner w-8 h-8 mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <motion.p
                className="text-accent-400 font-medium"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Loading AI Model...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="overlay glow-error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className="overlay-content">
              <motion.p
                className="text-red-400 font-medium"
                initial={{ y: 10 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.2 }}
              >
                ⚠️ {error}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Webcam Container */}
      <motion.div
        className="relative rounded-lg overflow-hidden border-2 border-accent-500/30 shadow-lg bg-black"
        whileHover={{ borderColor: 'rgba(34, 197, 94, 0.6)' }}
        transition={{ duration: 0.2 }}
      >
        <Webcam
          ref={webcamRef}
          className="w-full h-full object-cover"
          width={width}
          height={height}
          mirrored={true}
          onUserMedia={handleWebcamReady}
          videoConstraints={{
            width: width,
            height: height,
            facingMode: "user"
          }}
        />

        {/* Hand landmarks overlay canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            width: '100%',
            height: '100%'
          }}
        />

        {/* Status indicator */}
        <motion.div
          className="absolute top-2 right-2 z-20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className={`w-3 h-3 rounded-full ${
            error ? 'bg-red-500 glow-error' :
            isLoading ? 'bg-yellow-500 animate-pulse' :
            'bg-accent-500 glow-accent'
          }`} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default HandTracker;
