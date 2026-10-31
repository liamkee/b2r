import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteShell } from "./components/layout/SiteShell";
import { SavedProvider } from "./components/providers/SavedProvider";
const inter = Inter({ subsets: ["latin"], display: "swap" });
export const metadata: Metadata = { title: "ASEAN ONE — One ASEAN. Every Opportunity.", description: "Regulation, market and competitor views grouped by ASEAN country." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={inter.className}>
        <SavedProvider>
          <SiteShell>{children}</SiteShell>
        </SavedProvider>
      </body>
    </html>
  );
}
