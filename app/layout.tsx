import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./components/ui/Toast";
import Navbar from "./components/Navbar";
import FloatingInbox from "./components/FloatingInbox";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Synthé — The AR/VR Creator Platform",
  description: "Build, share, and monetize AR/VR experiences. Browse 3D models, join live workshops, book mentors, and generate AI-powered XR learning paths.",
  keywords: ["AR", "VR", "XR", "3D models", "WebXR", "immersive", "learning", "marketplace"],
  openGraph: {
    title: "Synthé — The AR/VR Creator Platform",
    description: "The unified platform for AR/VR creators, developers, and learners.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            {children}
            <FloatingInbox />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
