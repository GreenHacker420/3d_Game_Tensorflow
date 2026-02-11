"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

export type WebcamFeedHandle = {
    video: HTMLVideoElement | null;
};

interface WebcamFeedProps {
    onStreamReady?: (video: HTMLVideoElement) => void;
}

const WebcamFeed = forwardRef<WebcamFeedHandle, WebcamFeedProps>(({ onStreamReady }, ref) => {
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
            className="absolute bottom-4 left-4 w-48 h-36 border-2 border-cyan-500 rounded-lg transform scale-x-[-1] opacity-80"
            playsInline
            muted
        />
    );
});

WebcamFeed.displayName = "WebcamFeed";

export default WebcamFeed;
