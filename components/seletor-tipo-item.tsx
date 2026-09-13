'use client'

import { useState, useTransition } from 'react'
import { criarRascunho } from '@/lib/actions/items'
import { useT } from '@/lib/i18n/contexto'
import { ORDEM_TIPOS, TIPOS, type Idioma } from '@/lib/i18n/dicionarios'
import type { TipoItem } from '@/lib/types'

export function SeletorTipoItem({
  idioma,
  temAgenda = false,
}: {
  idioma: Idioma
  temAgenda?: boolean
}) {
  const t = useT()
  const [criando, setCriando] = useState<TipoItem | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()
  const rotulos = TIPOS[idioma]
  // Ordem alfabetica pelo nome no idioma de quem esta vendo, entao ela muda de
  // um idioma para outro.
  const tipos = [...ORDEM_TIPOS].sort((a, b) =>
    rotulos[a].nome.localeCompare(rotulos[b].nome, idioma)
  )

  return (
    <>
      {erro && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {erro}
        </p>
      )}

      <ul className="mt-6 space-y-2">
        {tipos.map((tipo) => {
          // So uma agenda por minisitee: com uma ja criada a opcao fica visivel,
          // mas avisa em vez de criar.
          const bloqueado = tipo === 'agenda' && temAgenda
          return (
            <li key={tipo}>
              <button
                type="button"
                disabled={pendente || bloqueado}
                onClick={() => {
                  setCriando(tipo as TipoItem)
                  setErro(null)
                  // Quando da certo a action redireciona e nao volta. Se voltou
                  // com erro, ele precisa aparecer: antes o clique simplesmente
                  // morria sem dizer nada.
                  iniciar(async () => {
                    const r = await criarRascunho(tipo as TipoItem)
                    if (r?.erro) setErro(r.erro)
                  })
                }}
                className="w-full rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:border-fg disabled:opacity-50"
              >
                <span className="block text-base font-semibold">
                  {criando === tipo && pendente ? t('criando') : rotulos[tipo].nome}
                </span>
                <span className="mt-1 block text-sm text-muted">
                  {bloqueado ? t('agendaJaExiste') : rotulos[tipo].descricao}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}
