import { AppShell } from "@/components/app-shell";
import { VoiceSettings } from "@/components/voice-settings";
import { ChangePasswordForm } from "@/components/change-password-form";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Cài đặt - CN",
};

export default function SettingsPage() {
    return (
        <AppShell>
            <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl">
                <div className="flex items-center justify-center mb-8">
                    <h1 className="text-3xl font-bold font-headline tracking-tight text-gradient">
                        Cài đặt
                    </h1>
                </div>
                
                <div className="grid gap-8 md:grid-cols-2">
                    {/* Password Change Section */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">
                            Bảo mật tài khoản
                        </h2>
                        <ChangePasswordForm />
                    </div>
                    
                    {/* Voice Settings Section */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-foreground">
                            Cài đặt giọng đọc
                        </h2>
                        <VoiceSettings />
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
