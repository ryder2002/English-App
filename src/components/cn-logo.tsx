import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

interface CNLogoProps {
    className?: string;
}

export function CNLogo({ className }: CNLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
        <div className="p-0.5 rounded-lg bg-gradient-to-br from-orange-400 to-pink-600">
            <div className="bg-gray-900 rounded-md p-1.5">
                 <Languages className="h-6 w-6 text-white" />
            </div>
        </div>
        <span className="text-2xl font-bold text-foreground">CN</span>
    </div>
  );
}
