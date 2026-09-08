import type { Metadata } from 'next'
import { basePublica } from '@/lib/site'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(basePublica()),
  title: { default: 'minisitee', template: '%s · minisitee' },
  description: 'Seu minisitee: seu catálogo em um link, pronto para o Instagram.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  )
}
