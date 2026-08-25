import type { Metadata } from "next";
import { AppProvider } from "@/components/app-provider";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Offline Intelligence", template: "%s | Offline Intelligence" },
  description: "An AI-native relationship CRM for founders and operators.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: { title: "Offline Intelligence", description: "An AI-native relationship CRM for founders and operators.", type: "website", images: [{ url: "/og.png", width: 1200, height: 630, alt: "Offline Intelligence relationship CRM" }] },
  twitter: { card: "summary_large_image", title: "Offline Intelligence", description: "An AI-native relationship CRM for founders and operators.", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AppProvider><AppShell>{children}</AppShell></AppProvider></body></html>;
}
