'use client'

import { useState, useTransition } from 'react'
import { criarRascunho } from '@/lib/actions/items'
import { useT } from '@/lib/i18n/contexto'
import { ORDEM_TIPOS, TIPOS, type Idioma } from '@/lib/i18n/dicionarios'
import type { TipoItem } from '@/lib/types'

export function SeletorTipoItem({ idioma }: { idioma: Idioma }) {
  const t = useT()
  const [criando, setCriando] = useState<TipoItem | null>(null)
  const [pendente, iniciar] = useTransition()
  const rotulos = TIPOS[idioma]

  return (
    <ul className="mt-6 space-y-2">
      {ORDEM_TIPOS.map((tipo) => (
        <li key={tipo}>
          <button
            type="button"
            disabled={pendente}
            onClick={() => {
              setCriando(tipo as TipoItem)
              iniciar(() => void criarRascunho(tipo as TipoItem))
            }}
            className="w-full rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:border-fg disabled:opacity-50"
          >
            <span className="block text-base font-semibold">
              {criando === tipo && pendente ? t('criando') : rotulos[tipo].nome}
            </span>
            <span className="mt-1 block text-sm text-muted">
              {rotulos[tipo].descricao}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
