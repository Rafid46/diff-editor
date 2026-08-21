import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Local Diff Code Editor - AI & Code Change Tracker',
  description: 'Fast, browser-native local diff code editor with real-time file system change detection, side-by-side Monaco diff viewer, and instant Accept/Reject controls.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-theme="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans h-screen w-screen overflow-hidden antialiased`}>
        {children}
      </body>
    </html>
  );
}
