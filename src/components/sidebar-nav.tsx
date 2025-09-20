"use client";

import { usePathname } from "next/navigation";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "./ui/sidebar";
import Link from "next/link";
import { BookText, Layers, Search, Bot, Folder, ListPlus, ClipboardCheck, Pencil, PlusSquare, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "Từ vựng", icon: BookText },
  { href: "/folders", label: "Thư mục", icon: Folder },
  { href: "/add-vocabulary", label: "Thêm từ vựng", icon: PlusSquare },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/test", label: "Kiểm tra", icon: ClipboardCheck },
  { href: "/dictionary", label: "Từ điển", icon: Search },
  { href: "/chatbot", label: "Trợ lý AI", icon: Bot },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={item.label}
            >
              <div>
                <item.icon />
                <span>{item.label}</span>
              </div>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
