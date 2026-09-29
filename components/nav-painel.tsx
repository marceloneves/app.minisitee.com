'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Girando } from '@/components/girando'
import { LogoutButton } from '@/components/logout-button'
import { useT } from '@/lib/i18n/contexto'

// Disparado pelo Voltar do menu; o editor de ferramenta escuta e cancela.
export const EVENTO_VOLTAR = 'minisitee:voltar'
// Disparado pelo editor quando nao conseguiu sair (o salvamento falhou).
export const EVENTO_VOLTAR_FALHOU = 'minisitee:voltar-falhou'

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
  const router = useRouter()

  // "Voltando..." aparece no clique e some sozinho quando a tela muda: guarda
  // em qual endereco o clique foi feito, em vez de um liga/desliga.
  const [voltandoDe, setVoltandoDe] = useState<string | null>(null)
  const voltando = voltandoDe === pathname
  // O mesmo para os links do menu: o clicado fica marcado e girando ate a
  // tela mudar. Clicar na tela atual nao dispara nada.
  const [indo, setIndo] = useState<{ href: string; de: string } | null>(null)
  const indoPara = indo?.de === pathname ? indo.href : null
  useEffect(() => {
    function falhou() {
      setVoltandoDe(null)
    }
    window.addEventListener(EVENTO_VOLTAR_FALHOU, falhou)
    return () => window.removeEventListener(EVENTO_VOLTAR_FALHOU, falhou)
  }, [])

  // 44 px de altura, a mesma do Voltar que ocupa esta linha em algumas telas.
  const base = 'inline-flex min-h-11 items-center rounded-xl border px-4 text-sm transition-colors'
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
    const marcado = indoPara ? indoPara === href : selecionado
    return `${base} shrink-0 gap-2 ${marcado ? ativo : inativo}`
  }

  // Funcao, e nao componente: declarado aqui dentro, um componente seria
  // recriado (e o link remontado) a cada render do menu.
  function item(href: string, children: React.ReactNode) {
    return (
      <Link
        key={href}
        href={href}
        onClick={() => {
          if (href !== pathname) setIndo({ href, de: pathname })
        }}
        aria-busy={indoPara === href}
        className={classe(href)}
      >
        {indoPara === href && <Girando />}
        {children}
      </Link>
    )
  }

  // Escolhendo ou configurando uma ferramenta, no plano Pro e no Ver minisitee, a linha do
  // menu vira so o Voltar, no mesmo lugar: a experiencia e uma so. Fica aqui,
  // no cliente, e nao no layout: o layout nao e desenhado de novo ao navegar.
  if (
    pathname.startsWith('/painel/novo') ||
    pathname.startsWith('/painel/item/') ||
    pathname.startsWith('/painel/plano-pro') ||
    pathname.startsWith('/painel/visualizar')
  ) {
    // O editor de ferramenta cuida da propria saida (salva o que falta e
    // apaga a ferramenta nova vazia): ele escuta o evento e o cancela.
    function voltar() {
      setVoltandoDe(pathname)
      const evento = new Event(EVENTO_VOLTAR, { cancelable: true })
      if (window.dispatchEvent(evento)) router.push('/painel')
    }
    return (
      <nav className="flex items-center">
        <button
          type="button"
          onClick={voltar}
          disabled={voltando}
          aria-busy={voltando}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-fg/25 bg-bg px-4 text-sm font-semibold shadow-sm disabled:cursor-wait disabled:opacity-80"
        >
          {voltando && <Girando />}
          {voltando ? t('voltando') : t('voltar')}
        </button>
      </nav>
    )
  }

  // Todas as opcoes numa linha so. No celular nao cabem: a linha desliza para
  // o lado sozinha (overflow-x-auto), sem a pagina rolar.
  return (
    <nav className="sem-barra -mx-4 flex w-[calc(100%+2rem)] items-center gap-2 overflow-x-auto px-4">
      {item('/painel', t('editar'))}
      {item('/painel/estilo', t('estilo'))}
      {agenda && item('/painel/agenda', t('agenda'))}
      {respostas && item('/painel/respostas', t('respostas'))}
      {item('/painel/perfil', t('perfil'))}
      {admin && item('/painel/admin', 'Admin')}
      {cubo && item('/painel/cubo', 'Cubo')}
      <span className="shrink-0">
        <LogoutButton />
      </span>
    </nav>
  )
}
