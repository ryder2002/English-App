
import { cn } from "@/lib/utils";

interface CNLogoProps {
    className?: string;
}

export function CNLogo({ className }: CNLogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
        <span className="text-3xl font-bold text-gradient">CN</span>
    </div>
  );
}
