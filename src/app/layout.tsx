import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/toaster";
import { VocabularyProvider } from "@/contexts/vocabulary-context";
import "./globals.css";
import { Inter, Lexend } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend" });

export const metadata: Metadata = {
  title: "RYDER",
  description: "Học từ vựng tiếng Anh và tiếng Trung một cách dễ dàng.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} ${lexend.variable} font-body antialiased`}>
        <VocabularyProvider>
          <AppShell>{children}</AppShell>
          <Toaster />
        </VocabularyProvider>
      </body>
    </html>
  );
}
