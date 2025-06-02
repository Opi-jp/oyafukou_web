import type { Metadata } from "next";
import { M_PLUS_1p, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const mplus1p = M_PLUS_1p({
  weight: ['400', '700', '900'],
  subsets: ["latin", "japanese"],
  variable: "--font-mplus1p",
});

const notoSansJP = Noto_Sans_JP({
  weight: ['400', '700', '900'],
  subsets: ["latin", "japanese"],
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "八丈島親不孝通り - 親には言えない夜が、ここにある",
  description: "八丈島唯一のはしご酒エリア。焼肉、寿司、ラーメン、カラオケまで、島の夜を彩る全店舗情報",
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