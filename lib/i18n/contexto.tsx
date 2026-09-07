'use client'

import { createContext, useContext } from 'react'
import { DICIONARIOS, traduzir, type Dicionario, type Idioma } from '@/lib/i18n/dicionarios'

const Contexto = createContext<Dicionario>(DICIONARIOS.pt)

export function ProvedorIdioma({
  idioma,
  children,
}: {
  idioma: Idioma
  children: React.ReactNode
}) {
  return <Contexto.Provider value={DICIONARIOS[idioma]}>{children}</Contexto.Provider>
}

export function useT() {
  const d = useContext(Contexto)
  return (chave: keyof Dicionario, vars?: Record<string, string | number>) =>
    traduzir(d, chave, vars)
}

export function useIdioma() {
  const d = useContext(Contexto)
  const entrada = (Object.entries(DICIONARIOS) as [Idioma, Dicionario][]).find(
    ([, dic]) => dic === d
  )
  return entrada?.[0] ?? 'pt'
}
