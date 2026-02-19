import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CreatorKeyword Pro — Profitable Keywords in Seconds",
  description: "Discover high-volume, low-competition keywords for YouTube, TikTok, and web content. AI-powered keyword intelligence for creators who demand the best data.",
  metadataBase: new URL("https://creatorkeyword.pro"),
  openGraph: {
    title: "CreatorKeyword Pro — Profitable Keywords in Seconds",
    description: "AI-powered keyword intelligence for creators. Find high-volume, low-competition keywords instantly.",
    url: "https://creatorkeyword.pro",
    siteName: "CreatorKeyword Pro",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CreatorKeyword Pro — Profitable Keywords in Seconds",
    description: "AI-powered keyword intelligence for creators. Find high-volume, low-competition keywords instantly.",
    creator: "@creatorkeyword",
  },
  alternates: {
    canonical: "https://creatorkeyword.pro",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CreatorKeyword Pro",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col bg-background text-foreground`}>
        <ToastProvider>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <BottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
