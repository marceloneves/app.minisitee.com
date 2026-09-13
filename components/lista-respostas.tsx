'use client'

import { useState, useTransition } from 'react'
import { excluirResposta, marcarResposta } from '@/lib/actions/formulario'
import type { RespostaCampo } from '@/lib/formulario'
import { useIdioma, useT } from '@/lib/i18n/contexto'
import { telefoneExibicao } from '@/lib/paises'
import { linkWhatsapp } from '@/lib/types'

export type Resposta = {
  id: string
  item_id: string
  respostas: RespostaCampo[]
  lida: boolean
  created_at: string
}

export function ListaRespostas({
  itens,
  titulos,
  mostrarTitulo,
}: {
  itens: Resposta[]
  titulos: Record<string, string>
  mostrarTitulo: boolean
}) {
  return (
    <ul className="mt-4 space-y-3">
      {itens.map((r) => (
        <LinhaResposta
          key={r.id}
          resposta={r}
          titulo={titulos[r.item_id] ?? ''}
          mostrarTitulo={mostrarTitulo}
        />
      ))}
    </ul>
  )
}

function LinhaResposta({
  resposta: r,
  titulo,
  mostrarTitulo,
}: {
  resposta: Resposta
  titulo: string
  mostrarTitulo: boolean
}) {
  const t = useT()
  const idioma = useIdioma()
  const [pendente, iniciar] = useTransition()
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const respostas = Array.isArray(r.respostas) ? r.respostas : []
  const nomeFormulario = titulo || t('respostaSemTitulo')
  const texto = (tipo: string) => {
    const valor = respostas.find((x) => x.tipo === tipo)?.valor
    return typeof valor === 'string' ? valor : null
  }
  const whatsapp = texto('whatsapp')
  const email = texto('email')

  // A hora do envio sai no fuso de quem esta vendo; no servidor o fuso e outro,
  // dai o suppressHydrationWarning no <time>.
  const quando = new Intl.DateTimeFormat(idioma, { dateStyle: 'medium', timeStyle: 'short' })
  const fmtData = new Intl.DateTimeFormat(idioma, { dateStyle: 'medium', timeZone: 'UTC' })

  function exibir(x: RespostaCampo) {
    if (Array.isArray(x.valor)) return x.valor.join(', ')
    if (x.tipo === 'whatsapp') return telefoneExibicao(x.valor)
    if (x.tipo === 'data') return fmtData.format(new Date(`${x.valor}T00:00:00Z`))
    return x.valor
  }

  function executar(acao: () => Promise<{ erro: string } | { ok: true }>) {
    setErro(null)
    iniciar(async () => {
      const resultado = await acao()
      if ('erro' in resultado) setErro(resultado.erro)
    })
  }

  return (
    <li
      className={`rounded-2xl border bg-surface p-4 ${r.lida ? 'border-border' : 'border-fg'} ${
        pendente ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {mostrarTitulo && <p className="truncate text-sm font-semibold">{nomeFormulario}</p>}
          <time
            dateTime={r.created_at}
            suppressHydrationWarning
            className="block text-xs text-muted"
          >
            {quando.format(new Date(r.created_at))}
          </time>
        </div>
        {!r.lida && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
            {t('respostaNova')}
          </span>
        )}
      </div>

      <dl className="mt-3 space-y-2">
        {respostas.map((x, i) => (
          <div key={i}>
            <dt className="text-xs text-muted">{x.rotulo}</dt>
            <dd className="whitespace-pre-line break-words text-sm">
              {x.tipo === 'email' && typeof x.valor === 'string' ? (
                <a href={`mailto:${x.valor}`} className="underline underline-offset-4">
                  {x.valor}
                </a>
              ) : (
                exibir(x)
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {whatsapp && (
          <a
            href={linkWhatsapp(whatsapp, t('respostaMensagem', { titulo: nomeFormulario }))}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border px-3 py-1.5 text-xs"
          >
            {t('whatsapp')}
          </a>
        )}
        {email && (
          <a href={`mailto:${email}`} className="rounded-lg border border-border px-3 py-1.5 text-xs">
            {t('email')}
          </a>
        )}
        <button
          type="button"
          disabled={pendente}
          onClick={() => executar(() => marcarResposta(r.id, !r.lida))}
          className="rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-50"
        >
          {r.lida ? t('respostaMarcarNaoLida') : t('respostaMarcarLida')}
        </button>

        {confirmando ? (
          <span className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted">{t('excluirMesmo')}</span>
            <button
              type="button"
              disabled={pendente}
              onClick={() => executar(() => excluirResposta(r.id))}
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
        <p role="alert" className="mt-2 text-xs text-red-600">
          {erro}
        </p>
      )}
    </li>
  )
}
