import React, { useRef, useEffect } from 'react';

/**
 * Minimalistic 3D scene container component
 */
const Scene3D = ({ 
  onSceneReady,
  className = '',
  width = '100%',
  height = '100%'
}) => {
  const canvasRef = useRef(null);

  /**
   * Handle canvas ready
   */
  useEffect(() => {
    if (canvasRef.current && onSceneReady) {
      // Set canvas size
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }

      // Notify parent component
      onSceneReady(canvasRef);
    }
  }, [onSceneReady]);

  /**
   * Handle window resize
   */
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const container = canvas.parentElement;
        
        if (container) {
          canvas.width = container.clientWidth;
          canvas.height = container.clientHeight;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`scene-3d ${className}`} style={{ width, height }}>
      <canvas
        ref={canvasRef}
        className="scene-canvas"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          background: '#1a1a1a'
        }}
      />

      <style>{`
        .scene-3d {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
          background: #1a1a1a;
        }

        .scene-canvas {
          cursor: grab;
          outline: none;
        }

        .scene-canvas:active {
          cursor: grabbing;
        }

        .scene-3d:focus-within .scene-canvas {
          box-shadow: 0 0 0 2px rgba(0, 255, 0, 0.3);
        }
      `}</style>
    </div>
  );
};

export default Scene3D;
