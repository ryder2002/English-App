"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  BookText,
  Layers,
  Search,
  Bot,
  Folder,
  PlusSquare,
  ClipboardCheck,
  Settings,
  Users,
  Menu,
  LogOut,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { UserAvatar } from "./user-avatar";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { CNLogo } from "./cn-logo";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "./ui/scroll-area";

// Navigation Items Structure
type NavItemType = {
  label: string;
  icon: any;
  href?: string;
  children?: { href: string; label: string; icon: any }[];
};

const navItems: NavItemType[] = [
  {
    label: "Từ vựng của tôi",
    icon: BookText,
    children: [
      { href: "/", label: "Danh sách từ", icon: BookText },
      { href: "/folders", label: "Thư mục", icon: Folder },
      { href: "/add-vocabulary", label: "Thêm từ mới", icon: PlusSquare },
    ],
  },
  {
    label: "Ôn tập",
    icon: GraduationCap,
    children: [
      { href: "/flashcards", label: "Flashcards", icon: Layers },
      { href: "/tests", label: "Kiểm tra", icon: ClipboardCheck },
    ],
  },
  { href: "/classes", label: "Lớp học", icon: Users },
  { href: "/dictionary", label: "Từ điển", icon: Search },
  { href: "/chatbot", label: "Trợ lý AI", icon: Bot },
];

// Context for controlling layout state
type LayoutContextType = {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
};

const LayoutContext = React.createContext<LayoutContextType | undefined>(
  undefined,
);

export const useLayout = () => {
  const context = React.useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a MainLayout");
  }
  return context;
};

export function MainLayout({ children }: { children: React.ReactNode }) {

  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Skip MainLayout for admin routes and auth pages
  if (pathname.startsWith('/admin') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/create-account')) {
    return <>{children}</>;
  }

  return (
    <LayoutContext.Provider value={{ isMobileOpen, setIsMobileOpen }}>
      <MainLayoutContent

        pathname={pathname}
        user={user}
        signOut={signOut}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      >
        {children}
      </MainLayoutContent>
    </LayoutContext.Provider>
  );
}

function MainLayoutContent({
  children,

  pathname,
  user,
  signOut,
  isMobileOpen,
  setIsMobileOpen,
}: {
  children: React.ReactNode;

  pathname: string;
  user: any;
  signOut: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}) {
  // State for collapsible sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Từ vựng của tôi": true,
    "Ôn tập": true,
  });
  const [scrolled, setScrolled] = useState(false);

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!user) return <>{children}</>;

  const getInitials = (email: string | null | undefined) => {
    if (!email) return "U";
    return email.charAt(0).toUpperCase();
  };

  const NavItem = ({
    item,
    isMobile = false,
  }: {
    item: NavItemType;
    isMobile?: boolean;
  }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = item.href
      ? item.href === "/"
        ? pathname === "/"
        : pathname.startsWith(item.href)
      : false;
    const isOpen = openSections[item.label];

    if (hasChildren) {
      return (
        <Collapsible
          open={isOpen}
          onOpenChange={() => toggleSection(item.label)}
          className="w-full"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-between px-3 py-2.5 h-auto font-medium hover:bg-accent/50 rounded-xl mb-1",
                isOpen ? "text-primary" : "text-muted-foreground",
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  isOpen ? "" : "-rotate-90",
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pl-4 animate-collapsible-down">
            {item.children?.map((child) => {
              const isChildActive =
                child.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(child.href);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={() => isMobile && setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 relative overflow-hidden",
                    isChildActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
                >
                  <child.icon className="w-4 h-4" />
                  <span>{child.label}</span>
                  {isChildActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r-full" />
                  )}
                </Link>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Link
        href={item.href!}
        onClick={() => isMobile && setIsMobileOpen(false)}
        className={cn(
          "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative overflow-hidden mb-1",
          isActive
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
        )}
      >
        <item.icon
          className={cn(
            "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
            isActive && "animate-pulse-slow",
          )}
        />
        <span className="flex-1">{item.label}</span>
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row overflow-hidden">
      {/* Background Ambient Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[280px] h-screen fixed top-0 left-0 z-50 border-r border-border/40 bg-background/80 backdrop-blur-xl shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 flex items-center justify-center">
              <Image
                src="/Logo.png"
                alt="Logo"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-1 py-4">
            <div className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider px-3 mb-2 mt-2">
              Menu
            </div>
            {navItems.map((item, index) => (
              <NavItem key={index} item={item} />
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/40 space-y-2">
          {/* Settings Link moved to bottom */}
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-accent/50",
              pathname === "/settings" &&
              "bg-accent/50 text-foreground font-medium",
            )}
          >
            <Settings className="w-5 h-5" />
            <span>Cài đặt</span>
          </Link>

          <div className="p-3 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm shadow-sm group hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              {user.id ? (
                <UserAvatar
                  userId={user.id}
                  userName={user.name || undefined}
                  userEmail={user.email}
                  size="md"
                  showName={false}
                  className="ring-2 ring-background shadow-sm"
                />
              ) : (
                <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                    {getInitials(user.email)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">
                  {user.name || "Người dùng"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors h-9"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      {pathname !== "/chatbot" && (
        <header
          className={cn(
            "lg:hidden fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 h-16 flex items-center justify-between",
            scrolled
              ? "bg-background/80 backdrop-blur-lg border-b border-border/40 shadow-sm"
              : "bg-transparent",
          )}
        >
          <div className="flex items-center gap-3">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl hover:bg-accent/10"
                >
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[300px] p-0 border-r border-border/40 bg-background/95 backdrop-blur-xl"
              >
                <div className="flex flex-col h-full">
                  <div className="p-6 flex items-center gap-3 border-b border-border/40">
                    <div className="relative">
                      <div className="w-16 h-16 flex items-center justify-center">
                        <Image
                          src="/Logo.png"
                          alt="Logo"
                          width={64}
                          height={64}
                          className="object-contain"
                        />
                      </div>
                    </div>

                  </div>

                  <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    {navItems.map((item, index) => (
                      <NavItem key={index} item={item} isMobile />
                    ))}

                    <div className="my-2 border-t border-border/40" />

                    <Link
                      href="/settings"
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-accent/50",
                        pathname === "/settings" &&
                        "bg-accent/50 text-foreground font-medium",
                      )}
                    >
                      <Settings className="w-5 h-5" />
                      <span>Cài đặt</span>
                    </Link>
                  </div>

                  <div className="p-6 border-t border-border/40 bg-muted/30">
                    <div className="flex items-center gap-3 mb-4">
                      {user.id ? (
                        <UserAvatar
                          userId={user.id}
                          userName={user.name || undefined}
                          userEmail={user.email}
                          size="md"
                          showName={false}
                        />
                      ) : (
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(user.email)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.name || user.email}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full justify-start border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                      onClick={signOut}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Đăng xuất
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <CNLogo className="w-8 h-8" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile User Avatar */}
            {user.id && (
              <Link href="/settings">
                <UserAvatar
                  userId={user.id}
                  userName={user.name || undefined}
                  userEmail={user.email}
                  size="sm"
                  showName={false}
                  className="ring-2 ring-background shadow-sm"
                />
              </Link>
            )}
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 flex flex-col min-h-0 overflow-hidden lg:pl-[280px]">
        {pathname === "/chatbot" ? (
          children
        ) : (
          <div className="flex-1 overflow-y-auto nice-scrollbar scroll-smooth">
            <div className="container max-w-7xl mx-auto p-4 lg:p-8 pt-20 lg:pt-8 pb-24 lg:pb-12 animate-in-fade">
              {children}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
