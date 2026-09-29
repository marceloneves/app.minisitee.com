'use client'

import Link from 'next/link'
import { useT } from '@/lib/i18n/contexto'

// Barra do topo das telas em que o menu do painel some (plano Pro, Ver
// minisitee): so o Voltar, igual ao do editor de ferramenta.
export function BarraVoltar({ href = '/painel' }: { href?: string }) {
  const t = useT()
  return (
    <div className="sticky top-0 z-10 flex items-center border-b border-border bg-bg/90 px-4 py-2 backdrop-blur">
      <Link
        href={href}
        className="inline-flex min-h-11 items-center rounded-xl border border-fg/25 bg-bg px-4 text-sm font-semibold shadow-sm"
      >
        {t('voltar')}
      </Link>
    </div>
  )
}
