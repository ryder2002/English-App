"use client";

import { usePathname } from "next/navigation";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "./ui/sidebar";
import Link from "next/link";
import { BookText, Layers, Search, Bot, Folder, PlusSquare, ClipboardCheck, Settings } from "lucide-react";
import { useSidebar } from "./ui/sidebar";
import { cn } from "@/lib/utils";

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
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    setOpenMobile(false);
  }

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const button = (
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={item.label}
              className="relative z-10"
            >
              <div>
                <item.icon />
                <span>{item.label}</span>
              </div>
            </SidebarMenuButton>
        );
        return (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} onClick={handleLinkClick}>
              {isActive ? (
                <div className="active-nav-item-gradient">{button}</div>
              ) : (
                button
              )}
            </Link>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  );
}
