import type { Metadata } from "next";
import { Noto_Sans_Devanagari } from "next/font/google";
import { hi } from "@/lib/i18n/hi";
import "./globals.css";

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-sans-devanagari",
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: hi.common.appName,
  description: hi.common.appSubtitle,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi" className={`${notoSansDevanagari.variable} font-sans`}>
      <body className="min-h-screen bg-white text-zinc-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
