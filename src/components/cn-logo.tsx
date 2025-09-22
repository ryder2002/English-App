import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

interface CNLogoProps {
    className?: string;
}

export function CNLogo({ className }: CNLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
        <span className="text-3xl font-bold text-gradient">CN</span>
        <Languages className="h-7 w-7 text-primary" />
    </div>
  );
}
