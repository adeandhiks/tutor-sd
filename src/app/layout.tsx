import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";
import { Providers } from "./providers";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AI Tutor SD — Asisten Belajar Anak Sekolah Dasar",
  description:
    "Aplikasi AI Chatbot untuk membantu siswa Sekolah Dasar (Kelas 1-6) belajar dengan cara yang menyenangkan, mudah dipahami, dan interaktif.",
  keywords: [
    "AI Tutor", "Sekolah Dasar", "Belajar Anak", "Chatbot Pendidikan",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body className="h-full overflow-hidden antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
