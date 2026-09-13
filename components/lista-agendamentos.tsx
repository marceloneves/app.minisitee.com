'use client'

import { useState, useTransition } from 'react'
import { mudarStatusAgendamento } from '@/lib/actions/agenda'
import { useIdioma, useT } from '@/lib/i18n/contexto'
import { telefoneExibicao } from '@/lib/paises'
import { linkWhatsapp } from '@/lib/types'

export type Agendamento = {
  id: string
  dia: string
  hora: string
  nome: string
  telefone: string
  email: string | null
  observacao: string | null
  status: string
}

const CLASSES_STATUS: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-900',
  confirmado: 'bg-green-100 text-green-800',
  cancelado: 'bg-zinc-200 text-zinc-600',
}

export function ListaAgendamentos({
  itens,
  passado = false,
}: {
  itens: Agendamento[]
  passado?: boolean
}) {
  const idioma = useIdioma()
  const fmtDia = new Intl.DateTimeFormat(idioma, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })

  const grupos = new Map<string, Agendamento[]>()
  for (const item of itens) {
    grupos.set(item.dia, [...(grupos.get(item.dia) ?? []), item])
  }

  return (
    <div className="mt-3 space-y-5">
      {[...grupos].map(([dia, lista]) => {
        const diaExtenso = fmtDia.format(new Date(`${dia}T00:00:00Z`))
        return (
          <div key={dia}>
            <h3 className="text-sm font-semibold first-letter:uppercase">{diaExtenso}</h3>
            <ul className="mt-2 space-y-2">
              {lista.map((a) => (
                <LinhaAgendamento
                  key={a.id}
                  agendamento={a}
                  diaExtenso={diaExtenso}
                  passado={passado}
                />
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

function LinhaAgendamento({
  agendamento: a,
  diaExtenso,
  passado,
}: {
  agendamento: Agendamento
  diaExtenso: string
  passado: boolean
}) {
  const t = useT()
  const [pendente, iniciar] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const hora = a.hora.slice(0, 5)
  const cancelado = a.status === 'cancelado'

  const rotulos: Record<string, string> = {
    pendente: t('agendaPendente'),
    confirmado: t('agendaConfirmado'),
    cancelado: t('agendaCancelado'),
  }

  function mudar(status: 'confirmado' | 'cancelado') {
    setErro(null)
    iniciar(async () => {
      const r = await mudarStatusAgendamento(a.id, status)
      if ('erro' in r && r.erro) setErro(r.erro)
    })
  }

  return (
    <li
      className={`rounded-2xl border border-border bg-surface p-3 ${
        pendente || cancelado ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="w-12 shrink-0 text-base font-semibold tabular-nums">{hora}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={`min-w-0 truncate text-sm font-semibold ${cancelado ? 'line-through' : ''}`}>
              {a.nome}
            </p>
            <span
              className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                CLASSES_STATUS[a.status] ?? CLASSES_STATUS.pendente
              }`}
            >
              {rotulos[a.status] ?? a.status}
            </span>
          </div>
          <p className="truncate text-xs text-muted">
            {telefoneExibicao(a.telefone)}
            {a.email && ` · ${a.email}`}
          </p>
          {a.observacao && (
            <p className="mt-1 whitespace-pre-line text-sm text-muted">{a.observacao}</p>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border pt-2">
        <a
          href={linkWhatsapp(a.telefone, t('agendaMensagem', { nome: a.nome, dia: diaExtenso, hora }))}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-border px-3 py-1.5 text-xs"
        >
          {t('whatsapp')}
        </a>
        {!passado && a.status === 'pendente' && (
          <button
            type="button"
            disabled={pendente}
            onClick={() => mudar('confirmado')}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-brand-fg disabled:opacity-50"
          >
            {t('agendaConfirmarAcao')}
          </button>
        )}
        {!passado && !cancelado && (
          <button
            type="button"
            disabled={pendente}
            onClick={() => mudar('cancelado')}
            className="ml-auto rounded-lg px-3 py-1.5 text-xs text-red-600 disabled:opacity-50"
          >
            {t('agendaCancelarAcao')}
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
