"use client";

import { UserCircle, Users, Layers, BookOpen, FileText, LogOut, Menu, X } from "lucide-react";
import Link from 'next/link';
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CNLogo } from "@/components/cn-logo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/admin", label: "Tổng quan", icon: Layers },
    { href: "/admin/classes", label: "Lớp học", icon: BookOpen },
    { href: "/admin/folders", label: "Thư mục", icon: Layers },
    { href: "/admin/add-vocabulary", label: "Thêm từ vựng", icon: FileText },
    { href: "/admin/tests", label: "Kiểm tra", icon: Users },
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
      <div className="flex items-center gap-3 px-4 md:px-6 py-4 md:py-6 border-b border-gray-200 dark:border-gray-700">
        <CNLogo />
        <span className="font-bold text-lg md:text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:inline">
        </span>
      </div>
      <nav className="mt-4 md:mt-6 space-y-1 md:space-y-2 px-2 md:px-4">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-2 md:gap-3 px-3 py-2.5 md:py-2 rounded-lg transition-all duration-200 text-sm md:text-base",
                isActive
                  ? "text-blue-700 dark:text-blue-400 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 font-semibold shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
              )}
            >
              <link.icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-2 md:px-4 py-4 border-t border-gray-200 dark:border-gray-700 space-y-2 mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 text-sm md:text-base"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Đăng xuất
        </Button>
        <div className="px-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} EnglishApp Admin
          </span>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700 shadow-sm flex-col justify-between">
        <NavContent />
      </aside>

      {/* Mobile Header & Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between px-3 py-1.5">
          <div className="scale-75">
            <CNLogo />
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[300px] p-0 bg-white dark:bg-gray-800">
              <div className="flex flex-col h-full">
                <NavContent onLinkClick={() => setMobileMenuOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-0 pt-20 md:pt-0 p-4 md:p-6 lg:p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
