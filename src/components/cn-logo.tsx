import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

interface CNLogoProps {
    className?: string;
}

export function CNLogo({ className }: CNLogoProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
        <div className="p-0.5 rounded-md logo-icon-gradient">
            <div className="p-1.5 rounded-[5px]">
                <Languages className="h-6 w-6 text-red-500" />
            </div>
        </div>
        <span className="text-3xl font-bold text-gradient">CN</span>
    </div>
  );
}
