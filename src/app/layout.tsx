import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
import Script from "next/script";

import { cx } from "~/shared/style";

import { MainLayout } from "./_components";
import { MotionProvider, HeroUIProvider } from "./_components/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "메이플 장비 진단",
  description: "캐릭터 장비의 스타포스·잠재능력을 진단하고 AI에 물어볼 프롬프트를 만들어 줍니다",
  openGraph: {
    title: "메이플 장비 진단",
    description: "캐릭터 장비의 스타포스·잠재능력을 진단하고 AI에 물어볼 프롬프트를 만들어 줍니다",
    siteName: "메이플 장비 진단",
  },
  other: {
    "google-adsense-account": process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ACCOUNT,
  },
};

export const viewport: Viewport = {
  themeColor: "#FF8009",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cx("font-pretendard", "font-medium")}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <GoogleAnalytics gaId={process.env.GA4_ID!} />
      <body>
        <MotionProvider>
          <HeroUIProvider>
            <MainLayout>{children}</MainLayout>
          </HeroUIProvider>
        </MotionProvider>

        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ACCOUNT}`}
          async
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}
