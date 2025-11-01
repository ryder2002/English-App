"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUserAvatar, getUserAvatarGradient } from "@/lib/avatar-utils";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  userId: number;
  userName?: string | null;
  userEmail?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showName?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8 text-base",
  md: "h-10 w-10 text-lg",
  lg: "h-12 w-12 text-xl",
  xl: "h-16 w-16 text-2xl",
};

export function UserAvatar({ 
  userId, 
  userName, 
  userEmail,
  size = "md", 
  className,
  showName = false 
}: UserAvatarProps) {
  const character = getUserAvatar(userId);
  const gradient = getUserAvatarGradient(userId);
  const displayName = userName || userEmail?.split('@')[0] || 'User';
  const initials = userName ? userName.charAt(0).toUpperCase() : (userEmail ? userEmail.charAt(0).toUpperCase() : 'U');

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Avatar className={cn(sizeClasses[size], "border-2 border-white dark:border-gray-800 shadow-md")}>
        <AvatarFallback 
          className={cn(
            "bg-gradient-to-br",
            gradient,
            "text-white font-bold flex items-center justify-center"
          )}
        >
          <span className="animate-pulse-slow">{character}</span>
        </AvatarFallback>
      </Avatar>
      {showName && (
        <span className="font-medium text-sm md:text-base">{displayName}</span>
      )}
    </div>
  );
}

