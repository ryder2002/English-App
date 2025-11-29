"use client";

import { Users, Folder, ClipboardList, FileCheck, LogOut, Menu, X, Settings, LayoutDashboard } from "lucide-react";
import Link from 'next/link';
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Image from "next/image";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/classes", label: "Lớp học", icon: Users },
    { href: "/admin/folders", label: "Thư mục", icon: Folder },
    { href: "/admin/homework", label: "Bài tập về nhà", icon: ClipboardList },
    { href: "/admin/tests", label: "Bài kiểm tra", icon: FileCheck },
  ];

  const handleLogout = async () => {
    if (auth?.signOut) {
      await auth.signOut();
    }
    router.push('/login');
    setMobileMenuOpen(false);
  };

  const NavContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <>
      {/* Logo Section */}
      <div className="p-6 flex items-center gap-3 border-b border-border/40">
        <div className="relative">
          <div className="w-16 h-16 flex items-center justify-center">
            <Image
              src="/Logo.png"
              alt="Admin Logo"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
        </div>
        <div>
          <h2 className="font-bold text-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Admin Panel
          </h2>
          <p className="text-xs text-muted-foreground">Quản lý hệ thống</p>
        </div>
      </div>

      {/* Navigation Links */}
      <ScrollArea className="flex-1 px-4">
        <nav className="py-6 space-y-2">
          <div className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider px-3 mb-4">
            Điều hướng
          </div>
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onLinkClick}
                className={cn(
                  "group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-primary/30 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:shadow-sm"
                )}
              >
                <link.icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-300",
                    isActive ? "scale-110" : "group-hover:scale-110"
                  )}
                />
                <span className="flex-1">{link.label}</span>
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer Section */}
      <div className="p-4 border-t border-border/40 space-y-2">
        {/* Settings Link */}
        <Link
          href="/admin/settings"
          onClick={onLinkClick}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
            pathname === "/admin/settings"
              ? "bg-accent text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          <Settings className="w-5 h-5" />
          <span>Cài đặt</span>
        </Link>

        {/* Logout Button */}
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Đăng xuất
        </Button>

        {/* Copyright */}
        <div className="px-2 pt-2">
          <p className="text-xs text-muted-foreground/60 text-center">
            © {new Date().getFullYear()} English App
          </p>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Background Ambient Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[280px] bg-background/80 backdrop-blur-xl border-r border-border/40 shadow-lg flex-col z-50">
        <NavContent />
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/40 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[300px] p-0 bg-background/95 backdrop-blur-xl border-r border-border/40"
            >
              <div className="flex flex-col h-full">
                <NavContent onLinkClick={() => setMobileMenuOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <Image
              src="/Logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Admin
            </span>
          </div>

          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-[280px] pt-[60px] lg:pt-0 relative z-10">
        <div className="container max-w-7xl mx-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
