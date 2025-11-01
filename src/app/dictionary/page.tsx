import { AppShell } from "@/components/app-shell";
import { DictionarySearch } from "@/components/dictionary-search";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Từ điển - CN",
};

export default function DictionaryPage() {
    return (
        <AppShell>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
                <div className="container mx-auto p-4 md:p-6 lg:p-8">
                    {/* Header với gradient */}
                    <div className="mb-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-6 border border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center justify-center gap-4">
                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-glow animate-pulse-slow">
                                <span className="text-3xl">📖</span>
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Từ điển
                                </h1>
                                <p className="text-sm text-muted-foreground mt-1 text-center">
                                    Tra cứu nghĩa và cách phát âm từ vựng
                                </p>
                            </div>
                        </div>
                    </div>
                    <DictionarySearch />
                </div>
            </div>
        </AppShell>
    );
}
