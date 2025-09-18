"use client";

import { usePathname } from "next/navigation";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "./ui/sidebar";
import Link from "next/link";
import { BookText, Layers, Search, Bot, Folder } from "lucide-react";

const navItems = [
  { href: "/", label: "Vocabulary", icon: BookText },
  { href: "/folders", label: "Folders", icon: Folder },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/dictionary", label: "Dictionary", icon: Search },
  { href: "/chatbot", label: "AI Chatbot", icon: Bot },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} legacyBehavior passHref>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={item.label}
            >
              <a>
                <item.icon />
                <span>{item.label}</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
