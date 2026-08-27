import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LASUASA Election Portal',
  description: 'Secure, transparent, and efficient voting platform',
  viewport: 'width=device-width, initial-scale=1.0',
  themeColor: '#061406',
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
