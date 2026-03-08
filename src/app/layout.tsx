import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Archivision AI",
  description: "Prompt to plan architecture in synchronized 2D and 3D."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
