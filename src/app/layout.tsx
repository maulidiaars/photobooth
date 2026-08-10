import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans, Caveat } from "next/font/google";
import "./globals.css";
import { APP_NAME } from "@/lib/constants";
import { ToastProvider } from "@/components/ui/Toast";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Photobooth online — jepret, tempel ke frame favoritmu, bawa pulang.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F6EEDD",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${fraunces.variable} ${jakarta.variable} ${caveat.variable}`}>
      <body className="min-h-screen w-full antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
