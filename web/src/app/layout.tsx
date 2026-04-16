import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Training — Claude Code & Windsurf",
  description: "Hands-on training for engineers using AI coding tools effectively.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} font-mono antialiased bg-white text-gray-900`}>
        <div className="max-w-3xl mx-auto px-6 py-10">
          {children}
        </div>
      </body>
    </html>
  );
}
