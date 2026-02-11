"use client";

import { useEffect, useRef, useState } from 'react';
import { SceneManager } from '@/core/SceneManager';
import { HandDetectionEngine } from '@/core/HandDetectionEngine';
import WebcamFeed from '@/components/WebcamFeed';
import { cn } from '@/lib/utils/cn';

interface GameCanvasProps {
    className?: string;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneManagerRef = useRef<SceneManager | null>(null);
    const handDetectionRef = useRef<HandDetectionEngine | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const requestRef = useRef<number | null>(null);

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Initialize SceneManager
        if (canvasRef.current && !sceneManagerRef.current) {
            sceneManagerRef.current = new SceneManager();
            sceneManagerRef.current.initialize(canvasRef.current);
        }

        // Initialize HandDetection
        const initDetection = async () => {
            handDetectionRef.current = new HandDetectionEngine();
            await handDetectionRef.current.initialize();
            setIsLoaded(true);
        };
        initDetection();

        // Cleanup
        return () => {
            if (sceneManagerRef.current) {
                sceneManagerRef.current.dispose();
                sceneManagerRef.current = null;
            }
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, []);

    const onStreamReady = (videoElement: HTMLVideoElement) => {
        videoRef.current = videoElement;
        startDetectionLoop();
    };

    const startDetectionLoop = () => {
        const loop = async () => {
            // 1. Check if all required components are ready
            if (
                handDetectionRef.current &&
                videoRef.current &&
                videoRef.current.readyState === 4 &&
                sceneManagerRef.current &&
                sceneManagerRef.current.scene
            ) {
                try {
                    // 2. Run detection
                    const hands = await handDetectionRef.current.detectHands(videoRef.current);

                    if (hands.length > 0) {
                        const hand = hands[0];
                        const keypoints = hand.keypoints;
                        const wrist = keypoints ? keypoints[0] : null; // Safety check

                        if (wrist) {
                            // 3. Initialize CoordinateMapper lazy-loaded singleton style
                            if (!(window as any).coordinateMapper) {
                                console.log("🗺️ Initializing CoordinateMapper...");
                                const { CoordinateMapper } = await import('@/core/CoordinateMapper');
                                (window as any).coordinateMapper = new CoordinateMapper(
                                    sceneManagerRef.current!.scene,
                                    videoRef.current!.videoWidth,
                                    videoRef.current!.videoHeight
                                );
                            }

                            // 4. Map coordinates and update 3D scene
                            if ((window as any).coordinateMapper) {
                                const worldPos = (window as any).coordinateMapper.mapToWorld(wrist.x, wrist.y);
                                sceneManagerRef.current!.updateHandPosition(worldPos);
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error in detection loop:", err);
                }
            }

            requestRef.current = requestAnimationFrame(loop);
        };
        loop();
    };

    return (
        <div className={cn("relative w-full h-full bg-black overflow-hidden", className)}>
            {/* 3D Canvas */}
            <canvas
                ref={canvasRef}
                className="w-full h-full block touch-none outline-none"
                id="renderCanvas"
            />

            {/* Webcam Feed (Component) */}
            <WebcamFeed onStreamReady={onStreamReady} />

            {/* HUD Overlay */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-start items-center pt-10 px-4">
                <h1 className="text-4xl md:text-6xl font-bold font-mono text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] tracking-tighter">
                    HAND POSE 3D
                </h1>
                <p className="text-cyan-200/60 text-sm mt-2 uppercase tracking-widest">Next.js 16 • Babylon.js • TensorFlow</p>

                {!isLoaded && (
                    <div className="mt-10 px-6 py-3 bg-black/50 backdrop-blur-md border border-yellow-500/30 rounded-full flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                        <span className="text-yellow-400 font-mono text-xs uppercase tracking-wider">Initializing Neural Net...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GameCanvas;
