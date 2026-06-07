import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
import { ThemeScript } from "@/components/theme-script";

export const metadata: Metadata = {
  title: "EasyFlow | DeFi on IOPN",
  description: "Swap, stake, multi-send, pools, borrow, and earn points on IOPN Testnet",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
