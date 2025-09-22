import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

interface CNLogoProps {
    className?: string;
}

export function CNLogo({ className }: CNLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
        <div className="p-0.5 rounded-md logo-icon-gradient">
            <div className="bg-muted p-1.5 rounded-[5px]">
                <Languages className="h-6 w-6 text-orange-600" />
            </div>
        </div>
        <span className="text-3xl font-bold text-gradient">CN</span>
    </div>
  );
}
