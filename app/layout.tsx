import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PAN Card Generator',
  description: 'Generate PAN Card from JSON data',
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

