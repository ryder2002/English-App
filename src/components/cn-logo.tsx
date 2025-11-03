
"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface CNLogoProps {
    className?: string;
    showText?: boolean;
    textSize?: "sm" | "md" | "lg";
}

export function CNLogo({ className, showText = true, textSize = "md" }: CNLogoProps) {
  const textSizeClasses = {
    sm: "text-sm font-medium",
    md: "text-lg font-semibold",
    lg: "text-xl font-bold",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
        <Image 
            src="/Logo.png"
            alt="CN Logo" 
            width={80}
            height={80}
            className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 object-contain flex-shrink-0"
            priority
        />
        {showText && (
          <span className={cn(
            "text-foreground whitespace-nowrap",
            textSizeClasses[textSize]
          )}>
            
          </span>
        )}
    </div>
  );
}
