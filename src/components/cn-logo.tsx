
"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface CNLogoProps {
    className?: string;
}

export function CNLogo({ className }: CNLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
        <Image 
            src="/Logo.png"
            alt="CN Logo" 
            width={80}
            height={80}
            className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 object-contain"
            priority
        />
    </div>
  );
}
