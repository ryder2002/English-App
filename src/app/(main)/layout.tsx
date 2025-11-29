"use client";

import { MainLayout } from "@/components/main-layout";

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <MainLayout>{children}</MainLayout>;
}
