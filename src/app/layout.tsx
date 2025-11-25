import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NZLouis AI Tasky",
  description: "Smart Tasky with AI",
  icons: {
    icon: "/favicon.ico?v=2",
  },
};

// Fix Next.js warning: viewport should be exported separately
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen flex flex-col overflow-x-hidden`}
        suppressHydrationWarning={true}
      >
        <SessionProviderWrapper>
          <div className="flex-1">
            <LayoutWrapper>{children}</LayoutWrapper>
          </div>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}