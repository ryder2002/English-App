import { VoiceSettings } from "@/components/voice-settings";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Cài đặt - CN",
};

export default function SettingsPage() {
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold font-headline tracking-tight text-gradient">
                    Cài đặt giọng đọc
                </h1>
            </div>
            <VoiceSettings />
        </div>
    );
}
