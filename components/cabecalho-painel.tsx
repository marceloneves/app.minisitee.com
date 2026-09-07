'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useT } from '@/lib/i18n/contexto'

export function CabecalhoPainel({
  titulo,
  subtitulo,
  podeCriar,
}: {
  titulo: string
  subtitulo?: string
  podeCriar: boolean
}) {
  const t = useT()
  const pathname = usePathname()

  const base = 'rounded-xl border px-4 py-2.5 text-sm transition-colors'
  const inativo = 'border-border hover:border-muted'
  const ativo = 'border-fg bg-fg font-medium text-bg'

  function classe(href: string) {
    return `${base} ${pathname.startsWith(href) ? ativo : inativo}`
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight">{titulo}</h1>
        {subtitulo && <p className="mt-0.5 text-xs text-muted">{subtitulo}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link href="/painel/estilo" className={classe('/painel/estilo')}>
          {t('estilo')}
        </Link>

        <Link href="/painel/visualizar" className={classe('/painel/visualizar')}>
          {t('verSite')}
        </Link>

        {podeCriar ? (
          <Link href="/painel/novo" className={classe('/painel/novo')}>
            {t('novoItem')}
          </Link>
        ) : (
          <span className={`${base} border-border text-muted`}>{t('novoItem')}</span>
        )}
      </div>
    </div>
  )
}
