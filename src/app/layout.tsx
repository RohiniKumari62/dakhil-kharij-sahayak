import type { Metadata } from "next";
import { Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-sans-devanagari",
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "दाखिल-खारिज सहायक",
  description: "बिहार अंचल कार्यालय हेतु दाखिल-खारिज कार्यप्रवाह प्रणाली",
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
