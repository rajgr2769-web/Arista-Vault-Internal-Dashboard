import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AnnouncementBar from "@/components/AnnouncementBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aristians.in Internal Dashboard",
  description: "Internal employee management system for Aristians.in",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AnnouncementBar />
        {children}
      </body>
    </html>
  );
}
