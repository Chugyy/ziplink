import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ziplink — Smart Link Tracker",
  description:
    "Create short links that track clicks and open apps natively on mobile.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
