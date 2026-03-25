import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CallProvider } from "@/context/CallContext";
import VideoOverlay from "@/components/VideoOverlay";
import CallInitializer from "@/components/CallInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StudyPortal",
  description: "A collaborative study platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CallProvider>
            {children}
            <VideoOverlay />
            <CallInitializer />
          </CallProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
