import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Lato } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

// Signals app chrome (inbox, alert titles, metric values) uses Lato Bold.
const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Signals Assistant · Root cause",
  description:
    "Verdigris Signals Assistant prototype: AI root cause analysis for a UPS rectifier alert.",
};

export const viewport: Viewport = {
  themeColor: "#fafafa",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${lato.variable} h-full antialiased`}
    >
      <body className="h-full">{children}</body>
    </html>
  );
}
