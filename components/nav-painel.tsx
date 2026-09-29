'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoutButton } from '@/components/logout-button'
import { useT } from '@/lib/i18n/contexto'

export function NavPainel({
  admin,
  cubo,
  agenda,
  respostas,
}: {
  admin: boolean
  cubo: boolean
  agenda: boolean
  respostas: boolean
}) {
  const t = useT()
  const pathname = usePathname()

  const base = 'rounded-lg border px-3 py-1.5 text-sm transition-colors'
  const inativo = 'border-border hover:border-muted'
  const ativo = 'border-fg bg-fg font-medium text-bg'

  // Configurar e a lista de ferramentas: /painel, a escolha de uma nova e o
  // editor de uma delas.
  const configurando =
    pathname === '/painel' ||
    pathname.startsWith('/painel/novo') ||
    pathname.startsWith('/painel/item')

  function classe(href: string) {
    // Assinatura fica dentro do Perfil: la, o Perfil continua marcado.
    const selecionado =
      href === '/painel'
        ? configurando
        : href === '/painel/perfil'
          ? pathname.startsWith(href) || pathname.startsWith('/painel/assinatura')
          : pathname.startsWith(href)
    return `${base} shrink-0 ${selecionado ? ativo : inativo}`
  }

  // Configurando uma ferramenta, no plano Pro e no Ver minisitee o menu some
  // (o logotipo e o nome ficam): para sair dali, so o Voltar da propria tela.
  // Fica aqui, no cliente, e nao no layout: o layout nao e desenhado de novo
  // ao navegar, e o menu so voltava depois de recarregar a pagina.
  if (
    pathname.startsWith('/painel/item/') ||
    pathname.startsWith('/painel/plano-pro') ||
    pathname.startsWith('/painel/visualizar')
  ) {
    return null
  }

  // Todas as opcoes numa linha so. No celular nao cabem: a linha desliza para
  // o lado sozinha (overflow-x-auto), sem a pagina rolar.
  return (
    <nav className="sem-barra -mx-4 flex w-[calc(100%+2rem)] items-center gap-2 overflow-x-auto px-4">
      <Link href="/painel" className={classe('/painel')}>
        {t('editar')}
      </Link>
      <Link href="/painel/estilo" className={classe('/painel/estilo')}>
        {t('estilo')}
      </Link>
      {agenda && (
        <Link href="/painel/agenda" className={classe('/painel/agenda')}>
          {t('agenda')}
        </Link>
      )}
      {respostas && (
        <Link href="/painel/respostas" className={classe('/painel/respostas')}>
          {t('respostas')}
        </Link>
      )}
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
      <span className="shrink-0">
        <LogoutButton />
      </span>
    </nav>
  )
}
