'use client'

import { useTransition } from 'react'
import { logout } from '@/lib/actions/auth'
import { useT } from '@/lib/i18n/contexto'

export function LogoutButton() {
  const t = useT()
  const [pendente, iniciar] = useTransition()

  return (
    <button
      type="button"
      onClick={() => iniciar(() => void logout())}
      disabled={pendente}
      className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm text-muted disabled:opacity-60"
    >
      {pendente ? t('saindo') : t('sair')}
    </button>
  )
}
