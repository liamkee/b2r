import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteShell } from "./components/layout/SiteShell";
const inter = Inter({ subsets: ["latin"], display: "swap" });
export const metadata: Metadata = { title: "B2R ASEAN Intelligence", description: "Regulation, market and competitor views grouped by ASEAN country." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className={inter.className}><SiteShell>{children}</SiteShell></body></html>;
}
