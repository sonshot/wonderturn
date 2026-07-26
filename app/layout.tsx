import type { Metadata } from "next";

import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
