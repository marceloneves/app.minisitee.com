'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useT } from '@/lib/i18n/contexto'

export function CabecalhoPainel({
  titulo,
  subtitulo,
}: {
  titulo: string
  subtitulo?: string
}) {
  const t = useT()
  const pathname = usePathname()

  const base = 'rounded-xl border px-4 py-2.5 text-sm transition-colors'
  const inativo = 'border-border hover:border-muted'
  const ativo = 'border-fg bg-fg font-medium text-bg'

  const emEdicao =
    pathname === '/painel' ||
    pathname.startsWith('/painel/item') ||
    pathname.startsWith('/painel/novo')

  function classe(href: string) {
    return `${base} ${pathname.startsWith(href) ? ativo : inativo}`
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="min-w-0 text-xl font-semibold tracking-tight">{titulo}</h1>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/painel"
            className={`${base} ${emEdicao ? ativo : inativo}`}
          >
            {t('editar')}
          </Link>

          <Link href="/painel/estilo" className={classe('/painel/estilo')}>
            {t('estilo')}
          </Link>

          <Link href="/painel/visualizar" className={classe('/painel/visualizar')}>
            {t('verSite')}
          </Link>

        </div>
      </div>

      {subtitulo && <p className="mt-2 text-xs text-muted">{subtitulo}</p>}
    </div>
  )
}
