import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const BackgroundBeams = ({
    className,
}) => {
    const beamsRef = useRef(null);

    useEffect(() => {
        if (!beamsRef.current) return;

        const canvas = beamsRef.current;
        const ctx = canvas.getContext("2d");
        let animationFrameId;

        const paths = [];
        const color = "100, 150, 255"; // Blue-ish

        const reset = () => {
            paths.length = 0;
            const totalPaths = 50;
            for (let i = 0; i < totalPaths; i++) {
                paths.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2 + 0.5,
                    speedX: Math.random() * 0.5 - 0.25,
                    speedY: Math.random() * 0.5 - 0.25,
                    opacity: Math.random() * 0.5 + 0.1,
                });
            }
        };

        const draw = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear only, don't fill black to allow transparency

            paths.forEach((p) => {
                p.x += p.speedX;
                p.y += p.speedY;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
                ctx.fill();

                // Add a glow effect
                ctx.shadowBlur = 15;
                ctx.shadowColor = `rgba(${color}, 0.5)`;
            });
            ctx.shadowBlur = 0;

            animationFrameId = requestAnimationFrame(draw);
        };

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            reset();
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        draw();

        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div
            className={cn(
                "absolute inset-0 w-full h-full bg-neutral-950 pointer-events-none",
                className
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-950/50 to-neutral-950 z-0 pointer-events-none" />
            <canvas
                ref={beamsRef}
                className="absolute inset-0 w-full h-full opacity-60"
            />
        </div>
    );
};
