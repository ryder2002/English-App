import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

interface CNLogoProps {
    className?: string;
    backgroundClass?: string;
}

export function CNLogo({ className, backgroundClass = "bg-sidebar" }: CNLogoProps) {
  return (
    <div className={cn("animated-gradient-border", className)}>
      <div className={cn("flex items-center justify-center gap-2 rounded-lg p-2", backgroundClass)}>
        <h1 className="text-4xl font-headline font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-transparent bg-clip-text">
          CN
        </h1>
        <Languages className="h-8 w-8 text-primary" />
      </div>
    </div>
  );
}
