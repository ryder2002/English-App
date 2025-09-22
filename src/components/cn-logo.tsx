import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

interface CNLogoProps {
    className?: string;
}

export function CNLogo({ className }: CNLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
        <div className="p-1 rounded-lg logo-icon-gradient">
            <div className="p-1.5 rounded-md bg-background">
                <Languages className="h-7 w-7 text-red-500" />
            </div>
        </div>
        <span className="text-3xl font-bold text-gradient">CN</span>
    </div>
  );
}
