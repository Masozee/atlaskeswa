import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans, Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_TITLE = "OMMHA - One Map for Mental Health Atlas";
const APP_DESCRIPTION =
  "Sistem Direktori Layanan Kesehatan Jiwa dan Manajemen Survei DESDE-LTC";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: APP_TITLE,
  description: APP_DESCRIPTION,
  applicationName: "OMMHA",
  // favicon.ico, icon.png, apple-icon.png in app/ are auto-detected by Next.
  openGraph: {
    type: "website",
    siteName: "OMMHA",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    url: SITE_URL,
    locale: "id_ID",
    // opengraph-image.png in app/ is auto-detected by Next.
  },
  twitter: {
    card: "summary_large_image",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    // twitter-image.png in app/ is auto-detected by Next.
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={cn("font-sans", inter.variable)} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider defaultTheme="system" storageKey="yakkum-ui-theme">
          <QueryProvider>
            {children}
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
