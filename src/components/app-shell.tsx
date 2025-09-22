
"use client";

import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SidebarNav } from "./sidebar-nav";
import { LogOut, Languages } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { CNLogo } from "./cn-logo";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();

  // If there's no user, we are likely on the login/signup page.
  // The AuthProvider will handle redirection for protected routes.
  if (!user) {
    return <>{children}</>;
  }
  
  const getInitials = (email: string | null | undefined) => {
    if (!email) return "U";
    return email.charAt(0).toUpperCase();
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <CNLogo />
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-2 flex flex-col gap-2">
            <div className="flex items-center gap-3 p-2 rounded-md">
                <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                        {getInitials(user.email)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-sm overflow-hidden">
                    <span className="font-medium truncate">{user.email}</span>
                </div>
            </div>
             <Button variant="ghost" className="justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
            </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background min-h-screen">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
          <SidebarTrigger />
           <div className="animated-gradient-border">
            <div className="flex items-center justify-center gap-2 bg-card rounded-lg p-1.5">
              <h1 className="text-3xl font-headline font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-transparent bg-clip-text">CN</h1>
              <Languages className="h-7 w-7 text-primary" />
            </div>
          </div>
        </header>
        <main>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
