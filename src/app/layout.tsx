import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Meyer Consulting Content Studio',
  description: 'Social Media Content Tool by Meyer Consulting',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
