'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Girando } from '@/components/girando'

// Botao quadrado so com icone (Nova ferramenta, Ver minisitee). No clique o
// icone vira o circulo girando ate a tela mudar, como nos outros botoes.
export function LinkIcone({
  href,
  rotulo,
  className,
  children,
}: {
  href: string
  rotulo: string
  className: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  // Guarda o endereco do clique: ao mudar de tela o estado some sozinho.
  const [abrindoDe, setAbrindoDe] = useState<string | null>(null)
  const abrindo = abrindoDe === pathname

  return (
    <Link
      href={href}
      aria-label={rotulo}
      title={rotulo}
      aria-busy={abrindo}
      onClick={() => setAbrindoDe(pathname)}
      className={`${className} ${abrindo ? 'pointer-events-none cursor-wait opacity-80' : ''}`}
    >
      {abrindo ? <Girando className="size-6" /> : children}
    </Link>
  )
}
