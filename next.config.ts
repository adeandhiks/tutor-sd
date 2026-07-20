import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  serverExternalPackages: ["html2pdf.js"],
  // Disable static page generation for the entire app
  // since all pages use client-side context providers
  output: undefined,
};

export default nextConfig;
