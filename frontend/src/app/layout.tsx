import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/context/ThemeContext";
import { InstallPWA } from "@/components/install-pwa";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "X-Pump - Gamificação para Academias",
  description:
    "App de gamificação para academias com ranking, redes sociais e desafios. Registre treinos, acompanhe nutrição e compete com amigos.",
  applicationName: "X-Pump",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "X-Pump",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "X-Pump",
    title: "X-Pump - Gamificação para Academias",
    description: "Transforme seus treinos em uma competição divertida",
  },
  twitter: {
    card: "summary",
    title: "X-Pump",
    description: "Gamificação para Academias",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#011b2a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>

        <InstallPWA />
        <Toaster richColors />
      </body>
    </html>
  );
}
