import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/context/ThemeContext";
import { InstallPWA } from "@/components/install-pwa";
import { PWAUpdatePrompt } from "@/components/pwa-update-prompt";

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
    statusBarStyle: "black-translucent",
    title: "X-Pump",
    startupImage: [
      {
        url: "/logo/x512x512.png",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "X-Pump",
    title: "X-Pump - Gamificação para Academias",
    description: "Transforme seus treinos em uma competição divertida",
    images: [
      {
        url: "/logo/x512x512.png",
        width: 512,
        height: 512,
        alt: "X-Pump Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "X-Pump",
    description: "Gamificação para Academias",
    images: ["/logo/x512x512.png"],
  },
  icons: {
    icon: [
      { url: "/logo/x.png", sizes: "any" },
      { url: "/logo/x192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/logo/x192x192.png", sizes: "192x192", type: "image/png" }],
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>

        <InstallPWA />
        <PWAUpdatePrompt />
        <Toaster richColors />
      </body>
    </html>
  );
}
