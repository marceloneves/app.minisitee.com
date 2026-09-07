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
      className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted disabled:opacity-60"
    >
      {pendente ? t('saindo') : t('sair')}
    </button>
  )
}
