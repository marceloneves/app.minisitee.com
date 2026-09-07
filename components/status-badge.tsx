'use client'

import { useIdioma } from '@/lib/i18n/contexto'
import { ROTULO_STATUS } from '@/lib/i18n/dicionarios'

const CLASSES: Record<string, string> = {
  rascunho: 'bg-zinc-200 text-zinc-700',
  ativo: 'bg-green-100 text-green-800',
  reservado: 'bg-amber-100 text-amber-900',
  encerrado: 'bg-zinc-800 text-zinc-100',
}

export function StatusBadge({ status }: { status: string }) {
  const idioma = useIdioma()
  const classe = CLASSES[status] ?? CLASSES.rascunho
  const rotulo = ROTULO_STATUS[idioma][status] ?? ROTULO_STATUS[idioma].rascunho

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${classe}`}
    >
      {rotulo}
    </span>
  )
}
