"use client";

import { usePathname } from "next/navigation";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "./ui/sidebar";
import Link from "next/link";
import { BookText, Layers, Search, Bot, Folder, ListPlus, ClipboardCheck } from "lucide-react";

const navItems = [
  { href: "/", label: "Từ vựng", icon: BookText },
  { href: "/folders", label: "Thư mục", icon: Folder },
  { href: "/batch-add", label: "Thêm hàng loạt", icon: ListPlus },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/test", label: "Kiểm tra", icon: ClipboardCheck },
  { href: "/dictionary", label: "Từ điển", icon: Search },
  { href: "/chatbot", label: "Trợ lý AI", icon: Bot },
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
