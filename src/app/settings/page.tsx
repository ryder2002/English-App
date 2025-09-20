import { VoiceSettings } from "@/components/voice-settings";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Cài đặt - RYDER",
};

export default function SettingsPage() {
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold font-headline tracking-tight bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-transparent bg-clip-text">
                    Cài đặt giọng đọc
                </h1>
            </div>
            <VoiceSettings />
        </div>
    );
}
