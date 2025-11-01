import { AppShell } from "@/components/app-shell";
import { VoiceSettings } from "@/components/voice-settings";
import { ChangePasswordForm } from "@/components/change-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Cài đặt - CN",
};

export default function SettingsPage() {
    return (
        <AppShell>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
                <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl">
                    {/* Header với gradient */}
                    <div className="mb-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-6 border border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center justify-center gap-4">
                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-glow animate-pulse-slow">
                                <span className="text-3xl">⚙️</span>
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    Cài đặt
                                </h1>
                                <p className="text-sm text-muted-foreground mt-1 text-center">
                                    Quản lý tài khoản và cài đặt ứng dụng
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Password Change Section */}
                        <Card className="border-0 shadow-soft bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                                        <span className="text-xl">🔒</span>
                                    </div>
                                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                        Bảo mật tài khoản
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ChangePasswordForm />
                            </CardContent>
                        </Card>
                        
                        {/* Voice Settings Section */}
                        <Card className="border-0 shadow-soft bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                                        <span className="text-xl">🔊</span>
                                    </div>
                                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                        Cài đặt giọng đọc
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <VoiceSettings />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
