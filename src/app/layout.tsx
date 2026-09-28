import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/python/AuthProvider";
import { AdProvider } from "@/components/python/AdProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "opsz"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
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
        className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground font-sans`}
      >
        <AuthProvider>
          <AdProvider>
            {children}
          </AdProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
