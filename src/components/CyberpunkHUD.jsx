import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TargetIcon,
    HandIcon,
    Crosshair2Icon,
    BoxModelIcon,
    LightningBoltIcon
} from '@radix-ui/react-icons';

/**
 * CyberpunkHUD: A unified, high-aesthetic HUD for the game
 */
const CyberpunkHUD = ({
    handState,
    objects = [],
    selectedObject = null,
    modeStatus,
    onToggleMinimize
}) => {
    const [isMinimized, setIsMinimized] = useState(false);

    // Format coordinates
    const formatCoord = (val) => typeof val === 'number' ? val.toFixed(1) : '0.0';

    // Get gesture icon and label
    const getGestureInfo = () => {
        if (!handState?.isTracking) return { icon: <HandIcon className="w-5 h-5 text-red-500" />, label: 'No Hand', color: 'text-red-500' };

        switch (handState.gesture) {
            case 'open_hand': return { icon: <HandIcon className="w-5 h-5 text-cyan-400" />, label: 'Move', color: 'text-cyan-400' };
            case 'closed_fist': return { icon: <BoxModelIcon className="w-5 h-5 text-purple-400" />, label: 'Grab', color: 'text-purple-400' };
            case 'pinch': return { icon: <Crosshair2Icon className="w-5 h-5 text-yellow-400" />, label: 'Resize', color: 'text-yellow-400' };
            case 'point': return { icon: <TargetIcon className="w-5 h-5 text-green-400" />, label: 'Select', color: 'text-green-400' };
            default: return { icon: <HandIcon className="w-5 h-5 text-gray-400" />, label: 'Tracking', color: 'text-gray-400' };
        }
    };

    const gestureInfo = getGestureInfo();

    return (
        <div className="fixed top-4 right-4 z-40 font-mono">
            <AnimatePresence>
                {!isMinimized ? (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="w-72 bg-black/80 backdrop-blur-md border rounded-xl overflow-hidden shadow-[0_0_15px_rgba(0,255,255,0.15)]"
                        style={{ borderColor: handState?.isTracking ? '#00f3ff' : '#ff0055' }}
                    >
                        {/* Header / Status Bar */}
                        <div className="bg-white/5 p-3 flex items-center justify-between border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${handState?.isTracking ? 'bg-cyan-400 animate-pulse' : 'bg-red-500'}`} />
                                <span className="text-xs font-bold tracking-widest text-white/90 uppercase">
                                    Sys.Link {handState?.isTracking ? 'ONLINE' : 'OFFLINE'}
                                </span>
                            </div>
                            <button
                                onClick={() => setIsMinimized(true)}
                                className="text-white/50 hover:text-white transition-colors"
                            >
                                <MinusIcon className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Main Display */}
                        <div className="p-4 space-y-4">

                            {/* Hand Status */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-white/5 border border-white/10 ${gestureInfo.color}`}>
                                        {gestureInfo.icon}
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-white/40 uppercase tracking-wider">Gesture</div>
                                        <div className={`text-sm font-bold ${gestureInfo.color}`}>{gestureInfo.label}</div>
                                    </div>
                                </div>

                                {/* Confidence Meter */}
                                <div className="text-right">
                                    <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Confidence</div>
                                    <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-cyan-400"
                                            animate={{ width: `${(handState?.confidence || 0) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Coordinates */}
                            {handState?.isTracking && (
                                <div className="grid grid-cols-3 gap-2 p-2 bg-black/40 rounded border border-white/5">
                                    <div className="text-center">
                                        <div className="text-[9px] text-red-400">X-AXIS</div>
                                        <div className="text-xs text-white">{formatCoord(handState.position?.x)}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[9px] text-green-400">Y-AXIS</div>
                                        <div className="text-xs text-white">{formatCoord(handState.position?.y)}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[9px] text-blue-400">Z-AXIS</div>
                                        <div className="text-xs text-white">{formatCoord(handState.position?.z)}</div>
                                    </div>
                                </div>
                            )}

                            {/* Active Object Info */}
                            {selectedObject ? (
                                <div className="p-3 rounded bg-cyan-900/20 border border-cyan-500/30">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs text-cyan-300 font-bold flex items-center gap-1">
                                            <TargetIcon className="w-3 h-3" /> TARGET LOCKED
                                        </span>
                                        <span className="text-[10px] text-cyan-500/70">ID: {selectedObject.id || '#01'}</span>
                                    </div>
                                    <div className="text-sm text-white font-medium">{selectedObject.name || selectedObject.type}</div>
                                    <div className="mt-2 flex gap-1 flex-wrap">
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Selected</span>
                                        {selectedObject.isGrabbed && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">Grabbed</span>}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 rounded bg-white/5 border border-white/5 text-center">
                                    <span className="text-xs text-white/30 italic">No Target Selected</span>
                                </div>
                            )}

                        </div>

                        {/* Footer */}
                        <div className="bg-black/40 p-2 text-center border-t border-white/5">
                            <span className="text-[9px] text-white/20 tracking-[0.2em]">NYX OBSERVER v2.0</span>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={() => setIsMinimized(false)}
                        className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-md border border-cyan-500/50 flex items-center justify-center hover:bg-cyan-900/20 transition-colors shadow-[0_0_10px_rgba(0,255,255,0.2)]"
                    >
                        <LightningBoltIcon className="w-5 h-5 text-cyan-400" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper icon
const MinusIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
);

export default CyberpunkHUD;
