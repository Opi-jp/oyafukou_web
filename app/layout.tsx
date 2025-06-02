import type { Metadata } from "next";
import { M_PLUS_1p, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const mplus1p = M_PLUS_1p({
  weight: ['400', '700', '900'],
  subsets: ["latin"],
  variable: "--font-mplus1p",
  preload: false,
});

const notoSansJP = Noto_Sans_JP({
  weight: ['400', '700', '900'],
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  preload: false,
});

export const metadata: Metadata = {
  title: "八丈島親不孝通り - 親には言えない夜が、ここにある",
  description: "八丈島唯一のはしご酒エリア。焼肉、寿司、ラーメン、カラオケまで、島の夜を彩る全店舗情報。営業時間、メニュー、アクセス情報を完全網羅。",
  keywords: "八丈島,親不孝通り,飲み屋,バー,居酒屋,焼肉,スナック,クラブ,夜遊び,はしご酒",
  authors: [{ name: "八丈島親不孝通り" }],
  openGraph: {
    title: "八丈島親不孝通り - 親には言えない夜が、ここにある",
    description: "八丈島唯一のはしご酒エリア。焼肉、寿司、ラーメン、カラオケまで、島の夜を彩る全店舗情報",
    url: "https://oyafukou-web.vercel.app",
    siteName: "八丈島親不孝通り",
    images: [
      {
        url: "/ogp-image.jpg",
        width: 1200,
        height: 630,
        alt: "八丈島親不孝通り",
      }
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "八丈島親不孝通り - 親には言えない夜が、ここにある",
    description: "八丈島唯一のはしご酒エリア。焼肉、寿司、ラーメン、カラオケまで、島の夜を彩る全店舗情報",
    images: ["/ogp-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${mplus1p.variable} ${notoSansJP.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}