import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/store/provider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GoCart Plaridel - Premium Multi-Vendor E-Commerce",
  description: "Discover premium products from multiple vendors. Shop electronics, fashion, beauty, and more with exclusive deals.",
  keywords: "ecommerce, multi-vendor, online shopping, electronics, fashion, beauty, plaridel",
  authors: [{ name: "GoCart Plaridel Team" }],
  openGraph: {
    title: "GoCart Plaridel - Premium Multi-Vendor E-Commerce",
    description: "Discover premium products from multiple vendors",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`} data-scroll-behavior="smooth">
      <body className="antialiased">
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
