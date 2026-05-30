import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'content.studio',
  description: 'Social Media Content Tool',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
