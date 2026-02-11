"use client";
import React from "react";
import { cn } from "@/lib/utils/cn";

export const GlowingCard = ({
    children,
    className,
}: {
    children?: React.ReactNode;
    className?: string;
}) => {
    return (
        <div className={cn("relative group p-[2px] rounded-3xl", className)}>
            <div
                className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"
            ></div>
            <div className="relative h-full bg-black rounded-2xl ring-1 ring-white/10 p-6 leading-none flex items-top justify-start space-x-6">
                {children}
            </div>
        </div>
    );
};
