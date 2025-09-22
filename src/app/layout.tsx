
import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/toaster";
import { VocabularyProvider } from "@/contexts/vocabulary-context";
import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";
import { SettingsProvider } from "@/contexts/settings-context";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CN - Language Learning",
  description: "Học từ vựng tiếng Anh và tiếng Trung một cách dễ dàng.",
  icons: {
    icon: `/images/BG.png`,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-body antialiased`}>
        <AuthProvider>
          <SettingsProvider>
            <VocabularyProvider>
              <AppShell>{children}</AppShell>
              <Toaster />
            </VocabularyProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
