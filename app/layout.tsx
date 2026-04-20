import type { Metadata } from "next";
// استيراد خط Cairo المودرن من جوجل
import { Cairo } from "next/font/google";
// @ts-ignore: side-effect import of CSS file without ambient module declaration
import "./globals.css";

// إعداد الخط بكل الأوزان المطلوبة عشان العناوين تطلع فخمة
const cairo = Cairo({ 
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "نظام المحاسبة - مطبعة الوزير ",
  description: "نظام إدارة المطابع الشامل",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      {/* تطبيق الخط الجديد على جسم الموقع بالكامل */}
      <body className={cairo.className}>{children}</body>
    </html>
  );
}