"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils/cn';

export type WebcamFeedHandle = {
    video: HTMLVideoElement | null;
};

interface WebcamFeedProps {
    onStreamReady?: (video: HTMLVideoElement) => void;
}

const WebcamFeed = forwardRef<WebcamFeedHandle, WebcamFeedProps & { className?: string }>(({ onStreamReady, className }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useImperativeHandle(ref, () => ({
        video: videoRef.current
    }));
    useEffect(() => {
        async function setupCamera() {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error("Browser API navigator.mediaDevices.getUserMedia not available");
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    'audio': false,
                    'video': {
                        facingMode: 'user',
                        width: 640,
                        height: 480
                    },
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        if (videoRef.current) {
                            videoRef.current.play();
                            if (onStreamReady) onStreamReady(videoRef.current);
                        }
                    };
                }
            } catch (e) {
                console.error("Error setting up video stream:", e);
            }
        }

        setupCamera();
    }, [onStreamReady]);
    return (
        <video
            ref={videoRef}
            className={cn("w-full h-full object-cover transform scale-x-[-1]", className)}
            playsInline
            muted
        />
    );
});

WebcamFeed.displayName = "WebcamFeed";

export default WebcamFeed;
