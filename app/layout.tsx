<<<<<<< HEAD
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "A股短线助手 - AI智能分析",
  description: "AI驱动的A股短线分析工具，提供个股体检、市场热点分析等功能",
}
=======
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "A股短线助手",
  description: "智能个股分析与市场热点追踪工具",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0ea5e9",
};
>>>>>>> origin/v0/zmpple-7535-fb84d16f

export default function RootLayout({
  children,
}: {
<<<<<<< HEAD
  children: React.ReactNode
=======
  children: React.ReactNode;
>>>>>>> origin/v0/zmpple-7535-fb84d16f
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
<<<<<<< HEAD
  )
=======
  );
>>>>>>> origin/v0/zmpple-7535-fb84d16f
}
