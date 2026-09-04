import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SPARKZ 2k26 - EE Freshers Party",
  description: "The official freshers' welcome by the Department of Electrical Engineering, Jadavpur University.",
};

import AnimatedBackground from "@/components/AnimatedBackground";
import SmoothScrolling from "@/components/SmoothScrolling";
import Navbar from "@/components/Navbar";


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#050505] text-white">
          <AnimatedBackground />
          <SmoothScrolling>
            <Navbar />
            {children}
          </SmoothScrolling>
      </body>
    </html>
  );
}
