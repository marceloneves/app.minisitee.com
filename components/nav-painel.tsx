'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoutButton } from '@/components/logout-button'
import { useT } from '@/lib/i18n/contexto'

export function NavPainel({ admin, cubo }: { admin: boolean; cubo: boolean }) {
  const t = useT()
  const pathname = usePathname()

  const base = 'rounded-lg border px-3 py-1.5 text-sm transition-colors'
  const inativo = 'border-border hover:border-muted'
  const ativo = 'border-fg bg-fg font-medium text-bg'

  // Perfil e Admin sao secoes proprias. Todo o resto de /painel/* — estilo,
  // visualizar, novo, editor de item — continua sendo o Painel.
  const SECOES = ['/painel/perfil', '/painel/admin', '/painel/cubo']
  const emOutraSecao = SECOES.some((s) => pathname.startsWith(s))

  function classe(href: string) {
    const selecionado =
      href === '/painel' ? !emOutraSecao : pathname.startsWith(href)
    return `${base} ${selecionado ? ativo : inativo}`
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <Link href="/painel" className={classe('/painel')}>
        {t('painel')}
      </Link>
      <Link href="/painel/perfil" className={classe('/painel/perfil')}>
        {t('perfil')}
      </Link>
      {admin && (
        <Link href="/painel/admin" className={classe('/painel/admin')}>
          Admin
        </Link>
      )}
      {cubo && (
        <Link href="/painel/cubo" className={classe('/painel/cubo')}>
          Cubo
        </Link>
      )}
      <LogoutButton />
    </div>
  )
}
