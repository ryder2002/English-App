
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { VocabularyProvider } from "@/contexts/vocabulary-context";
import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";
import { SettingsProvider } from "@/contexts/settings-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CN English",
  description: "Học từ vựng tiếng Anh và tiếng Trung một cách dễ dàng.",
  icons: {
    icon: [
      { url: "/Logo.png", type: "image/png" },
    ],
    apple: "/Logo.png",
    shortcut: "/Logo.png",
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
        <link rel="icon" href="/Logo.png" type="image/png" />
        <link rel="shortcut icon" href="/Logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/Logo.png" />
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
        
        {/* PWA Audio Debug - Auto-run diagnostics in PWA mode */}
        <Script id="pwa-audio-debug" strategy="afterInteractive">
          {`
            if (typeof window !== 'undefined') {
              // Import and run PWA audio diagnostics
              import('/src/lib/pwa-audio-debug.ts').then(module => {
                if (module.PWAAudioDebug.isPWA()) {
                  console.log('🔧 PWA Mode Detected');
                  module.PWAAudioDebug.logDiagnostics();
                }
              }).catch(err => console.warn('Could not load PWA debug:', err));
            }
          `}
        </Script>
      </body>
    </html>
  );
}
