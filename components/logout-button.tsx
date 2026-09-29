'use client'

import { useTransition } from 'react'
import { Girando } from '@/components/girando'
import { logout } from '@/lib/actions/auth'
import { useT } from '@/lib/i18n/contexto'

export function LogoutButton() {
  const t = useT()
  const [pendente, iniciar] = useTransition()

  return (
    <button
      type="button"
      // await, e nao void: com void a transicao terminava na hora e o
      // "Saindo..." sumia antes de sair.
      onClick={() => iniciar(async () => { await logout() })}
      disabled={pendente}
      aria-busy={pendente}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm text-muted disabled:cursor-wait disabled:opacity-80"
    >
      {pendente && <Girando />}
      {pendente ? t('saindo') : t('sair')}
    </button>
  )
}
