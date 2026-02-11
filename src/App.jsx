import React from 'react';

import { useEffect, useRef } from 'react';
import { SceneManager } from './core/SceneManager';

function App() {
  const canvasRef = useRef(null);
  const sceneManagerRef = useRef(null);

  useEffect(() => {
    // Initialize SceneManager
    if (canvasRef.current && !sceneManagerRef.current) {
      sceneManagerRef.current = new SceneManager();
      sceneManagerRef.current.initialize(canvasRef.current);
    }

    // Cleanup
    return () => {
      if (sceneManagerRef.current) {
        sceneManagerRef.current.dispose();
        sceneManagerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none outline-none"
        id="renderCanvas"
      />

      {/* HUD Layer (Pointer Events passed through where possible) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex justify-center items-start pt-10">
        <h1 className="text-4xl font-bold font-mono text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
          3D Hand Pose Game
        </h1>
      </div>
    </div>
  );
}

export default App;
