import { DictionarySearch } from "@/components/dictionary-search";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Từ điển - CN",
};

export default function DictionaryPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
            <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:p-6 lg:p-8">
                {/* Header với gradient */}
                <div className="mb-4 sm:mb-6 md:mb-8 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-4 sm:p-5 md:p-6 border border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center justify-center gap-3 sm:gap-4">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-glow animate-pulse-slow flex-shrink-0">
                            <span className="text-xl sm:text-2xl md:text-3xl">📖</span>
                        </div>
                        <div className="text-center sm:text-left">
                            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Từ điển
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                                Tra cứu nghĩa và cách phát âm từ vựng
                            </p>
                        </div>
                    </div>
                </div>
                <DictionarySearch />
            </div>
        </div>
    );
}
