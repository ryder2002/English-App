
"use client";

import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarTrigger,
  SheetContent,
  Sheet,
} from "@/components/ui/sidebar";
import { SidebarNav } from "./sidebar-nav";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { CNLogo } from "./cn-logo";
import { useSidebar } from "./ui/sidebar";
import { UserAvatar } from "./user-avatar";

function MobileSheetContent() {
    const authContext = useAuth();
    
    if (!authContext) {
        return null;
    }
    
    const { user, signOut } = authContext;
    const getInitials = (email: string | null | undefined) => {
        if (!email) return "U";
        return email.charAt(0).toUpperCase();
    }

    return (
        <SheetContent
            side="left"
            className="w-[18rem] bg-sidebar p-0 text-sidebar-foreground flex flex-col"
        >
             <SidebarHeader className="p-4">
                <CNLogo />
            </SidebarHeader>
            <SidebarContent className="p-2">
                <SidebarNav />
            </SidebarContent>
            <SidebarFooter className="p-2 flex flex-col gap-2 mt-auto">
                 <div className="flex items-center gap-3 p-2 rounded-md">
                    {user?.id ? (
                      <UserAvatar 
                        userId={user.id} 
                        userName={user.name || undefined} 
                        userEmail={user.email} 
                        size="md"
                        showName={false}
                      />
                    ) : (
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                            {getInitials(user?.email)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex flex-col text-sm overflow-hidden">
                        <span className="font-medium truncate">{user?.name || user?.email}</span>
                        {user?.name && user?.email && (
                          <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                        )}
                    </div>
                </div>
                <Button variant="ghost" className="justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                </Button>
            </SidebarFooter>
        </SheetContent>
    )
}


export function AppShell({ children }: { children: React.ReactNode }) {
  const authContext = useAuth();
  const { isMobile, openMobile, setOpenMobile } = useSidebar();

  if (!authContext) {
    return <>{children}</>;
  }

  const { user, signOut } = authContext;

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
    <div className="md:grid md:grid-cols-[auto_1fr]">
      <Sidebar>
        <SidebarHeader className="p-4">
          <CNLogo />
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-2 flex flex-col gap-2">
            <div className="flex items-center gap-3 p-2 rounded-md">
                {user.id ? (
                  <UserAvatar 
                    userId={user.id} 
                    userName={user.name || undefined} 
                    userEmail={user.email} 
                    size="md"
                    showName={false}
                  />
                ) : (
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                        {getInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex flex-col text-sm overflow-hidden">
                    <span className="font-medium truncate">{user.name || user.email}</span>
                    {user.name && user.email && (
                      <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                    )}
                </div>
            </div>
             <Button variant="ghost" className="justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
            </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-11 items-center gap-2 border-b bg-background/95 px-3 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
          <SidebarTrigger className="h-8 w-8" />
          <div className="scale-75 origin-left">
            <CNLogo />
          </div>
        </header>

        {isMobile && (
            <Sheet open={openMobile} onOpenChange={setOpenMobile}>
                <MobileSheetContent />
            </Sheet>
        )}
        
        <main>{children}</main>
      </SidebarInset>
    </div>
  );
}
