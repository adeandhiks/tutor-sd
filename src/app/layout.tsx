import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";
import { Providers } from "./providers";

const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Cerdasik — AI Tutor SD | Belajar jadi mudah, pintar jadi seru!",
  description:
    "Cerdasik adalah aplikasi AI Chatbot untuk membantu siswa Sekolah Dasar (Kelas 1-6) belajar dengan cara yang menyenangkan, mudah dipahami, dan interaktif.",
  keywords: [
    "Cerdasik", "AI Tutor SD", "Sekolah Dasar", "Belajar Anak", "Chatbot Pendidikan",
  ],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${nunito.variable} h-full`}
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
