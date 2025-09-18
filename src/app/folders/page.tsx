import { FolderManager } from "@/components/folder-manager";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Manage Folders - LinguaLeap",
};

export default function FoldersPage() {
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold font-headline tracking-tight">
                    Manage Folders
                </h1>
            </div>
            <FolderManager />
        </div>
    );
}