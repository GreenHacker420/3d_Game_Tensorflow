import React from "react";
import { cn } from "../../lib/utils";

export const Card = ({
    className,
    children,
}) => {
    return (
        <div
            className={cn(
                "rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 shadow-md backdrop-blur-sm relative overflow-hidden group",
                className
            )}
        >
            <div className="absolute inset-0 bg-neutral-800/20 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300" />
            <div className="relative z-10">{children}</div>
        </div>
    );
};

export const CardTitle = ({
    className,
    children,
}) => {
    return (
        <h4 className={cn("text-zinc-100 font-bold tracking-wide mt-4", className)}>
            {children}
        </h4>
    );
};

export const CardDescription = ({
    className,
    children,
}) => {
    return (
        <p
            className={cn(
                "mt-4 text-zinc-400 tracking-wide leading-relaxed text-sm",
                className
            )}
        >
            {children}
        </p>
    );
};
