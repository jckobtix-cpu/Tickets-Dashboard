import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tickets Dashboard',
  description: 'Financial tracking dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  )
}
