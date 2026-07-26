import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";

const literata = localFont({
  display: "optional",
  src: "../node_modules/@fontsource-variable/literata/files/literata-latin-wght-normal.woff2",
  variable: "--font-literata",
  weight: "200 900",
});

export const metadata: Metadata = {
  title: "Wonderturn",
  description: "A private, family-only voice practice tool.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={literata.variable}>
      <body>{children}</body>
    </html>
  );
}
