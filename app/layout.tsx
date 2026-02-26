import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"

import "./globals.css"

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

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
    <html lang="fr">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
