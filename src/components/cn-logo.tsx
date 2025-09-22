import { Languages } from "lucide-react";

export function CNLogo() {
  return (
    <div className="animated-gradient-border">
      <div className="flex items-center justify-center gap-2 rounded-lg bg-sidebar p-2">
        <h1 className="text-4xl font-headline font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-transparent bg-clip-text">
          CN
        </h1>
        <Languages className="h-8 w-8 text-primary" />
      </div>
    </div>
  );
}
