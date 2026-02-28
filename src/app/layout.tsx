import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PocketWise - Quản Lý Tiền Tiêu Vặt Thông Minh",
  description: "Ứng dụng quản lý tiền tiêu vặt thông minh dành cho học sinh, tích hợp AI phân tích chi tiêu và gợi ý tiết kiệm.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        {children}
      </body>
    </html>
  );
}
