
"use client";

import { cn } from "@/lib/utils";
import { Languages } from "lucide-react";

interface CNLogoProps {
    className?: string;
}

export function CNLogo({ className }: CNLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
        <img 
            src="https://www.kaizapp.com/wp-content/uploads/2023/10/icon-instant-translation.svg"
            alt="CN Logo" 
            className="h-8 w-8"
        />
        <span className="text-3xl font-bold text-gradient">CN</span>
    </div>
  );
}
