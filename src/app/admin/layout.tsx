"use client";

import { UserCircle, Users, Layers, BookOpen, FileText, LogOut } from "lucide-react";
import Link from 'next/link';
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();

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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 px-6 py-6 border-b">
            <UserCircle className="w-8 h-8 text-blue-600" />
            <span className="font-bold text-xl text-blue-700">Admin Panel</span>
          </div>
          <nav className="mt-6 space-y-2 px-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg",
                    isActive
                      ? "text-blue-700 bg-blue-100 font-semibold"
                      : "text-gray-700 hover:bg-blue-50"
                  )}
                >
                  <link.icon className="w-5 h-5" /> {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="px-4 py-4 border-t space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:bg-red-50 hover:text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </Button>
          <div className="px-2">
            <span className="text-xs text-gray-400">
              © {new Date().getFullYear()} EnglishApp Admin
            </span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
