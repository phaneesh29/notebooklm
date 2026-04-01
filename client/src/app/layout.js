import { Inter, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata = {
  title: "NotebookLM Workspace",
  description: "A structured research workspace for groups, profile controls, and Gemini access.",
};

import { ClerkProvider } from '@clerk/nextjs';

import Navbar from '@/components/Navbar';

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} ${lora.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col relative overflow-x-hidden">
          <div className="pointer-events-none fixed inset-0 -z-10">
            <div className="absolute -top-36 left-[-10%] h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute top-[24%] right-[-8%] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="absolute bottom-[-8rem] left-[25%] h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
          </div>
          <Navbar />
          <main className="flex-1 flex flex-col relative">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
