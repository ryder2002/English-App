
"use client";

import { cn } from "@/lib/utils";

interface CNLogoProps {
    className?: string;
}

export function CNLogo({ className }: CNLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
        <img 
            src="/BG.png"
            alt="CN Logo" 
            className="h-8 w-8"
        />
        <span className="text-2xl font-bold text-gradient">CN</span>
    </div>
  );
}
