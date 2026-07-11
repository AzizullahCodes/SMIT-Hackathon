import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "MaintainIQ - AI-Powered Maintenance Platform",
  description:
    "Scan. Report. Diagnose. Maintain. A professional maintenance-management platform for physical assets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen"
        cz-shortcut-listen="true">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
