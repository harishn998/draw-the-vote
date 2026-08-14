// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Draw the Vote — 176 million voters. Most of them cannot read.",
  description:
    "India, 1951. Every party gets a picture instead of a name. Draw six symbols that a rice farmer in Bihar and a fisherman in Malabar will both recognise.",
  openGraph: {
    title: "Draw the Vote",
    description: "Draw it so they cannot get it wrong.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* data-theme switches the palette: chakra (default) · forest · cream */}
      <body data-theme="chakra">{children}</body>
    </html>
  );
}
