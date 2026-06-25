import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Meyer Consulting Content Studio',
  description: 'Social Media Content Tool by Meyer Consulting',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Content Studio',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
