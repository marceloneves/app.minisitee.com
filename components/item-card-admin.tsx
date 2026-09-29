'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { StatusBadge } from '@/components/status-badge'
import { duplicarItem, excluirItem, moverItem } from '@/lib/actions/items'
import { textoDoPreco } from '@/lib/format'
import { IconeSecao } from '@/components/icone-secao'
import { RedeIcone, nomeDaRede } from '@/components/rede-icone'
import { useIdioma, useT } from '@/lib/i18n/contexto'
import { TIPOS } from '@/lib/i18n/dicionarios'
import { soPro } from '@/lib/types'

export type ItemResumo = {
  id: string
  slug: string
  title: string
  kind: string
  data: { links?: { rede: string; url: string }[] } | null
  status: string
  url: string | null
  price_cents: number | null
  price_note: string | null
  cover_url: string | null
}

export function ItemCardAdmin({
  item,
  posicao,
  primeiro,
  ultimo,
  ehFree,
}: {
  item: ItemResumo
  username: string
  posicao: number
  primeiro: boolean
  ultimo: boolean
  ehFree: boolean
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
    ? nomeDoTipo
    : (item.kind === 'link' || item.kind === 'qrcode') && item.url
      ? item.url
      : item.kind === 'redes' && redes.length
        ? redes.map((l) => nomeDaRede(l.rede)).join(', ')
        : nomeDoTipo

  return (
    // O numero da ordem e um selo no meio da borda de cima do cartao, metade
    // para fora. Fica fora da div do cartao, que corta o que
    // passa da borda (overflow-hidden).
    <li className={`relative ${pendente ? 'opacity-60' : ''}`}>
      <span
        aria-hidden="true"
        className="absolute -top-4 left-1/2 z-10 flex size-8 -translate-x-1/2 items-center justify-center rounded-full bg-fg text-sm font-bold text-bg shadow-sm ring-2 ring-bg"
      >
        {posicao}
      </span>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
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

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="min-w-0 truncate text-sm font-semibold">{item.title || nomeDoTipo}</h2>
              <StatusBadge status={item.status} />
            </div>
            {contexto && <p className="mt-0.5 truncate text-xs text-muted">{contexto}</p>}
            {ehFree && soPro(item.kind) && (
              <p className="mt-1 text-xs font-medium text-amber-700">{t('ferramentaForaDoPlano')}</p>
            )}
            {ehProduto && (
              <p className="mt-1 text-sm font-semibold">
                {textoDoPreco(item.price_cents, item.price_note) || t('semValor')}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col justify-center gap-2">
            <button
              type="button"
              aria-label={`${t('moverCima')}: ${item.title || nomeDoTipo}`}
              disabled={primeiro || pendente}
              onClick={() => executar(() => moverItem(item.id, 'cima'))}
              className="flex size-11 items-center justify-center rounded-xl border border-fg/25 bg-bg shadow-sm text-base disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`${t('moverBaixo')}: ${item.title || nomeDoTipo}`}
              disabled={ultimo || pendente}
              onClick={() => executar(() => moverItem(item.id, 'baixo'))}
              className="flex size-11 items-center justify-center rounded-xl border border-fg/25 bg-bg shadow-sm text-base disabled:opacity-30"
            >
              ↓
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border p-3">
          <Link
            href={`/painel/item/${item.id}`}
            className="inline-flex min-h-11 items-center rounded-xl bg-fg px-5 text-sm font-semibold text-bg"
          >
            {t('editar')}
          </Link>
          {/* Produto nao tem pagina propria: o atalho so aparece com link informado. */}
          {ehProduto && item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-xl border border-fg/25 bg-bg shadow-sm px-4 text-sm font-medium"
            >
              {t('verPagina')}
            </a>
          )}
          {item.kind === 'formulario' && (
            <Link
              href={`/painel/respostas?f=${item.id}`}
              className="inline-flex min-h-11 items-center rounded-xl border border-fg/25 bg-bg shadow-sm px-4 text-sm font-medium"
            >
              {t('formularioVerRespostas')}
            </Link>
          )}
          {item.kind === 'agenda' ? (
            // Uma agenda so por minisitee: no lugar de duplicar, o atalho para os agendamentos.
            <Link
              href="/painel/agenda"
              className="inline-flex min-h-11 items-center rounded-xl border border-fg/25 bg-bg shadow-sm px-4 text-sm font-medium"
            >
              {t('agendaVerCompromissos')}
            </Link>
          ) : (
            <button
              type="button"
              disabled={pendente}
              onClick={() => executar(() => duplicarItem(item.id))}
              className="inline-flex min-h-11 items-center rounded-xl border border-fg/25 bg-bg shadow-sm px-4 text-sm font-medium disabled:opacity-50"
            >
              {t('duplicar')}
            </button>
          )}

          {confirmando ? (
            <span className="ml-auto flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted">{t('excluirMesmo')}</span>
              <button
                type="button"
                disabled={pendente}
                onClick={() => executar(() => excluirItem(item.id))}
                className="inline-flex min-h-11 items-center rounded-xl bg-red-600 px-4 text-sm font-medium text-white disabled:opacity-50"
              >
                {t('simExcluir')}
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="inline-flex min-h-11 items-center rounded-xl border border-fg/25 bg-bg shadow-sm px-4 text-sm font-medium"
              >
                {t('cancelar')}
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              className="ml-auto inline-flex min-h-11 items-center rounded-xl border border-red-300 bg-bg px-4 text-sm font-medium text-red-600 shadow-sm"
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
      </div>
    </li>
  )
}
