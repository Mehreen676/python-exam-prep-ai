import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/python/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Python Exam Prep AI — Chapters 1–40",
  description:
    "An interactive Python study companion built around the syllabus of A Smarter Way to Learn Python by Mark Myers. Read lessons, practice MCQs, drill flashcards, take timed mock exams.",
  keywords: [
    "Python", "learn Python", "Python exam", "Python MCQs",
    "A Smarter Way to Learn Python", "Mark Myers", "Python beginner",
  ],
  authors: [{ name: "Mehreen Zohair" }],
  creator: "Mehreen Zohair",
  publisher: "Mehreen Zohair",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
