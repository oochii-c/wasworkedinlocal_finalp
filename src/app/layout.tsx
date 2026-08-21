import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "사주 운세 앱",
  description: "년도별 운세 페이지",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
