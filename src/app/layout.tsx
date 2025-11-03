
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { VocabularyProvider } from "@/contexts/vocabulary-context";
import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";
import { SettingsProvider } from "@/contexts/settings-context";
import { SidebarProvider } from "@/components/ui/sidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CN English",
  description: "Học từ vựng tiếng Anh và tiếng Trung một cách dễ dàng.",
  icons: {
    icon: [
      { url: "/BG.png", sizes: "16x16", type: "image/png" },
      { url: "/BG.png", sizes: "32x32", type: "image/png" },
      { url: "/BG.png", sizes: "48x48", type: "image/png" },
      { url: "/BG.png", sizes: "64x64", type: "image/png" },
      { url: "/BG.png", sizes: "128x128", type: "image/png" },
      { url: "/BG.png", sizes: "192x192", type: "image/png" },
      { url: "/BG.png", sizes: "256x256", type: "image/png" },
      { url: "/BG.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/BG.png",
    shortcut: "/BG.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CN English",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
       <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"></meta>
        <meta name="referrer" content="no-referrer" />
        <meta name="application-name" content="CN" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CN" />
        <link rel="apple-touch-icon" href="/BG.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/BG.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/BG.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/BG.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/BG.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/BG.png" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0A0F1F" />
      </head>
      <body className={`${inter.variable} font-body antialiased`}>
        <AuthProvider>
          <SettingsProvider>
            <VocabularyProvider>
              <SidebarProvider>{children}</SidebarProvider>
              <Toaster />
            </VocabularyProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
