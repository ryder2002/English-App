import { AppShell } from "@/components/app-shell";
import { DictionarySearch } from "@/components/dictionary-search";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Từ điển - CN",
};

export default function DictionaryPage() {
    return (
        <AppShell>
            <div className="container mx-auto p-4 md:p-6 lg:p-8">
                <div className="flex items-center justify-center mb-6">
                    <h1 className="text-3xl font-bold font-headline tracking-tight text-gradient">
                        Từ điển
                    </h1>
                </div>
                <DictionarySearch />
            </div>
        </AppShell>
    );
}
