import type { Metadata, Viewport } from "next";
import ClientEffects from "@/components/ClientEffects";
import "./globals.css";

export const metadata: Metadata = {
  title: "PhonicsTeacher - 儿童自然拼读",
  description: "3-8岁儿童英语自然拼读 AI 私教，用规则学发音",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PhonicsTeacher",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-dvh">
        <ClientEffects />
        <main className="pb-20">{children}</main>
      </body>
    </html>
  );
}
