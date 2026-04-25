import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // <<-- ВОТ ЭТА СТРОКА САМАЯ ВАЖНАЯ

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WebMind AI",
  description: "Анализатор сайтов на базе AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}