'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { StatusBadge } from '@/components/status-badge'
import { duplicarItem, excluirItem, moverItem } from '@/lib/actions/items'
import { formatBRL } from '@/lib/format'
import { IconeSecao } from '@/components/icone-secao'
import { RedeIcone, nomeDaRede } from '@/components/rede-icone'
import { useIdioma, useT } from '@/lib/i18n/contexto'
import { TIPOS } from '@/lib/i18n/dicionarios'

export type ItemResumo = {
  id: string
  slug: string
  title: string
  kind: string
  data: { links?: { rede: string; url: string }[] } | null
  status: string
  url: string | null
  category: string | null
  location: string | null
  price_cents: number | null
  price_note: string | null
  cover_url: string | null
}

export function ItemCardAdmin({
  item,
  username,
  posicao,
  primeiro,
  ultimo,
}: {
  item: ItemResumo
  username: string
  posicao: number
  primeiro: boolean
  ultimo: boolean
}) {
  const t = useT()
  const idioma = useIdioma()
  const [pendente, iniciar] = useTransition()
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function executar(acao: () => Promise<{ erro?: string } | void>) {
    setErro(null)
    iniciar(async () => {
      const r = await acao()
      if (r && 'erro' in r && r.erro) setErro(r.erro)
    })
  }

  const ehProduto = item.kind === 'produto'
  const nomeDoTipo = TIPOS[idioma][item.kind]?.nome ?? item.kind
  const redes = (item.data?.links ?? []).filter((l) => l.rede)
  const contexto = ehProduto
    ? [item.category, item.location].filter(Boolean).join(' · ') || nomeDoTipo
    : (item.kind === 'link' || item.kind === 'qrcode') && item.url
      ? item.url
      : item.kind === 'redes' && redes.length
        ? redes.map((l) => nomeDaRede(l.rede)).join(', ')
        : nomeDoTipo

  return (
    <li
      className={`overflow-hidden rounded-2xl border border-border bg-surface ${
        pendente ? 'opacity-60' : ''
      }`}
    >
      <div className="flex gap-3 p-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-border">
          {item.cover_url ? (
            <Image src={item.cover_url} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            <span className="flex h-full flex-col items-center justify-center gap-1 px-1 text-center">
              {item.kind === 'whatsapp' || item.kind === 'telefone' ? (
                <RedeIcone rede={item.kind} tamanho="size-7" />
              ) : item.kind === 'redes' && redes.length ? (
                <span className="flex items-center gap-1">
                  {redes.slice(0, 2).map((l, i) => (
                    <RedeIcone key={i} rede={l.rede} tamanho="size-7" />
                  ))}
                </span>
              ) : (
                <IconeSecao tipo={item.kind} tamanho="size-7" />
              )}
              {ehProduto && <span className="text-xs text-muted">{t('semFoto')}</span>}
            </span>
          )}
        </div>

        <span
          aria-hidden="true"
          className="flex size-6 shrink-0 items-center justify-center self-center rounded-full border border-border text-xs font-semibold text-muted"
        >
          {posicao}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="min-w-0 truncate text-sm font-semibold">{item.title}</h2>
            <StatusBadge status={item.status} />
          </div>
          {contexto && <p className="mt-0.5 truncate text-xs text-muted">{contexto}</p>}
          {ehProduto && (
            <p className="mt-1 text-sm font-semibold">
              {item.price_cents ? formatBRL(item.price_cents) : t('semValor')}
              {item.price_cents && item.price_note && (
                <span className="ml-1 text-xs font-normal text-muted">
                  {item.price_note}
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col justify-center gap-1">
          <button
            type="button"
            aria-label={`${t('moverCima')}: ${item.title}`}
            disabled={primeiro || pendente}
            onClick={() => executar(() => moverItem(item.id, 'cima'))}
            className="rounded-lg border border-border px-2 py-1 text-xs disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            aria-label={`${t('moverBaixo')}: ${item.title}`}
            disabled={ultimo || pendente}
            onClick={() => executar(() => moverItem(item.id, 'baixo'))}
            className="rounded-lg border border-border px-2 py-1 text-xs disabled:opacity-30"
          >
            ↓
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border px-3 py-2">
        <Link
          href={`/painel/item/${item.id}`}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
        >
          {t('editar')}
        </Link>
        {ehProduto && (
          <Link
            href={`/${username}/${item.slug}`}
            className="rounded-lg border border-border px-3 py-1.5 text-xs"
          >
            {t('verPagina')}
          </Link>
        )}
        {item.kind === 'agenda' ? (
          // Uma agenda so por minisitee: no lugar de duplicar, o atalho para os agendamentos.
          <Link
            href="/painel/agenda"
            className="rounded-lg border border-border px-3 py-1.5 text-xs"
          >
            {t('agendaVerCompromissos')}
          </Link>
        ) : (
          <button
            type="button"
            disabled={pendente}
            onClick={() => executar(() => duplicarItem(item.id))}
            className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-50"
          >
            {t('duplicar')}
          </button>
        )}

        {confirmando ? (
          <span className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted">{t('excluirMesmo')}</span>
            <button
              type="button"
              disabled={pendente}
              onClick={() => executar(() => excluirItem(item.id))}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {t('simExcluir')}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs"
            >
              {t('cancelar')}
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="ml-auto rounded-lg px-3 py-1.5 text-xs text-red-600"
          >
            {t('excluir')}
          </button>
        )}
      </div>

      {erro && (
        <p role="alert" className="border-t border-border px-3 py-2 text-xs text-red-600">
          {erro}
        </p>
      )}
    </li>
  )
}
