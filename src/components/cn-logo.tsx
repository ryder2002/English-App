
import { cn } from "@/lib/utils";
import { Languages } from "lucide-react";

interface CNLogoProps {
    className?: string;
}

export function CNLogo({ className }: CNLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
        <div className="p-1 rounded-xl logo-icon-gradient">
            <Languages className="h-7 w-7 text-primary" />
        </div>
        <span className="text-2xl font-bold text-gradient">CN</span>
    </div>
  );
}
