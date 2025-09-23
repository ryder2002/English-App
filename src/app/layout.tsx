
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
    icon: "https://www.kaizapp.com/wp-content/uploads/2023/10/icon-instant-translation.svg",
  },
  manifest: "/manifest.json",

};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
       <head>
        <meta name="application-name" content="CN" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CN" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
      </head>
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
