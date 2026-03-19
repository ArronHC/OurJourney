import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Our Journey",
  description: "记录我们每一次相见",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
