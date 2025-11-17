import { AppShell } from "@/components/app-shell";
import { FolderManagerWithHierarchy } from "@/components/folder-manager-hierarchy";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Quản lý Thư mục - CN",
};

export default function FoldersPage() {
    return (
        <AppShell>
            <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:p-6 lg:p-8">
                <h1 className="text-2xl sm:text-3xl font-bold mb-6">Quản lý Thư mục</h1>
                <FolderManagerWithHierarchy />
            </div>
        </AppShell>
    );
}
