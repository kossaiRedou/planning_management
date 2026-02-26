import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display, DM_Sans } from "next/font/google"

import { AuthProvider } from "@/lib/auth-context"
import "./globals.css"
import "./landing.css"

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-dm-sans" })

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.shiftme.sbs"

export const metadata: Metadata = {
  title: "ShiftMe | Gestion des plannings",
  description:
    "Application de gestion des plannings. Planification, disponibilites et suivi des heures.",
  icons: {
    icon: "/logowithoutBG.png",
    apple: "/logowithoutBG.png",
  },
  openGraph: {
    title: "ShiftMe | Gestion des plannings",
    description: "Application de gestion des plannings. Planification, disponibilites et suivi des heures.",
    url: appUrl,
    siteName: "ShiftMe",
    images: [{ url: `${appUrl}/logowithoutBG.png`, width: 512, height: 512, alt: "ShiftMe" }],
    locale: "fr_FR",
  },
  twitter: {
    card: "summary",
    title: "ShiftMe | Gestion des plannings",
    description: "Application de gestion des plannings. Planification, disponibilites et suivi des heures.",
    images: [`${appUrl}/logowithoutBG.png`],
  },
}

export const viewport: Viewport = {
  themeColor: "#1e3a5f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
