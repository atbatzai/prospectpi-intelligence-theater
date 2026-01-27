import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import '@/styles/brand.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProspectPI Intelligence Platform",
  description: "Generate comprehensive business intelligence reports in seconds",
  applicationName: "ProspectPI Intelligence Platform",
  keywords: ['business intelligence', 'company research', 'dossier', 'intelligence gathering', 'AI research'],
  authors: [{ name: 'ProspectPI' }],
  creator: 'ProspectPI',
  manifest: '/manifest.json',
  themeColor: '#1E3A8A',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ProspectPI',
  },
  openGraph: {
    title: 'ProspectPI Intelligence Platform',
    description: 'Generate comprehensive business intelligence reports in seconds',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#1E3A8A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
