import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LASUASA Election Portal',
  description: 'Secure, transparent, and efficient voting platform',
  themeColor: '#061406',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
