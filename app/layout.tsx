import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AntdRegistry from "@/lib/AntdRegistry";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "emfulfill | Modern Fulfillment for POD & Dropshipping",
  description: "Advanced job-based fulfillment for high-volume POD and dropshipping sellers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body
        className={`${inter.variable} antialiased font-sans`}
        suppressHydrationWarning
      >
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}
