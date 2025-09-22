
import { cn } from "@/lib/utils";
import { Languages } from "lucide-react";

interface CNLogoProps {
    className?: string;
}

export function CNLogo({ className }: CNLogoProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
        <Languages className="h-8 w-8 logo-icon-gradient text-transparent bg-clip-text" />
        <span className="text-2xl font-bold text-gradient">CN</span>
    </div>
  );
}
