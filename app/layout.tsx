import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "FoodOps ERP", template: "%s · FoodOps ERP" },
  description: "Stock, recipes, production batches and traceability for food & drink producers.",
};

export const viewport: Viewport = {
  themeColor: "#2f5d50",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
