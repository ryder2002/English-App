import { FolderManagerWithHierarchy } from "@/components/folder-manager-hierarchy";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Quản lý Thư mục - CN",
};

export default function FoldersPage() {
    return (
        <div className="container mx-auto px-2 py-3 sm:px-4 sm:py-6 md:px-6 md:py-8 max-w-7xl">
            <div className="mb-8">
                {/* Mobile Layout */}
                <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent text-center sm:text-left">
                    Thư mục của tôi
                </h1>
            </div>

            <FolderManagerWithHierarchy />
        </div>
    );
}
