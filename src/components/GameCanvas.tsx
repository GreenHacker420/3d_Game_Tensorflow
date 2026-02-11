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
        <div className={cn("w-full min-h-screen bg-black p-4 md:p-10 font-sans", className)}>
            <div className="max-w-7xl mx-auto mb-8 flex justify-between items-end border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tighter">
                        HAND POSE 3D
                    </h1>
                    <p className="text-neutral-500 text-sm mt-1 uppercase tracking-widest">
                        Next.js 16 • Babylon.js • TensorFlow
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full animate-pulse", isLoaded ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-yellow-500 shadow-[0_0_10px_#eab308]")} />
                    <span className="text-white/60 text-xs font-mono">{isLoaded ? "SYSTEM ONLINE" : "INITIALIZING..."}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl mx-auto h-[75vh]">
                {/* Main Play Area (Bento Large Item) */}
                <div className="md:col-span-3 h-full relative group rounded-3xl border border-white/10 bg-neutral-900/50 overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
                    <div className="absolute top-4 left-6 z-10 px-3 py-1 bg-black/40 backdrop-blur rounded-full border border-white/10 text-xs text-white/70 font-mono tracking-wider">
                        LIVE SIMULATION
                    </div>

                    <canvas
                        ref={canvasRef}
                        className="w-full h-full block touch-none outline-none relative z-0"
                        id="renderCanvas"
                    />

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-50" />
                </div>

                {/* Sidebar Area */}
                <div className="md:col-span-1 flex flex-col gap-6 h-full">

                    {/* Camera Card */}
                    <div className="relative rounded-3xl border border-white/10 bg-neutral-900/50 overflow-hidden h-1/3 p-1">
                        <div className="absolute top-3 left-4 z-20 text-[10px] text-white/40 uppercase tracking-widest font-mono">OPTICAL FEED</div>
                        <div className="w-full h-full rounded-2xl overflow-hidden relative">
                            <WebcamFeed onStreamReady={onStreamReady} className="opacity-80 hover:opacity-100 transition-opacity duration-500" />
                            {/* Scanline Effect */}
                            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
                        </div>
                    </div>

                    {/* Stats / Controls Card */}
                    <div className="flex-1 rounded-3xl border border-white/10 bg-neutral-900/50 p-6 flex flex-col relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                            <span className="text-cyan-400">❖</span> TELEMETRY
                        </h3>

                        <div className="space-y-4 font-mono text-xs">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span className="text-white/40">STATUS</span>
                                <span className={isLoaded ? "text-green-400" : "text-yellow-400"}>{isLoaded ? "ACTIVE" : "LOADING"}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span className="text-white/40">FPS</span>
                                <span className="text-white">60</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span className="text-white/40">INPUT</span>
                                <span className="text-white">{videoRef.current ? "VIDEO STREAM" : "NO SIGNAL"}</span>
                            </div>

                            <div className="mt-6 p-3 rounded bg-black/40 border border-white/5 text-white/50 leading-relaxed">
                                &gt; Waiting for user input...<br />
                                &gt; Hand tracking algorithms initialized.<br />
                                &gt; 3D Engine ready.
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default GameCanvas;
