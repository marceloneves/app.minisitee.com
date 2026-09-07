'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useT } from '@/lib/i18n/contexto'
import { createClient } from '@/lib/supabase/client'

export function BarraDono({ profileId }: { profileId: string }) {
  const t = useT()
  const [ehDono, setEhDono] = useState(false)

  useEffect(() => {
    let ativo = true
    createClient()
      .auth.getClaims()
      .then(({ data }) => {
        if (ativo) setEhDono(data?.claims?.sub === profileId)
      })
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [profileId])

  if (!ehDono) return null

  return (
    <div className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2">
        <span className="text-xs text-muted">{t('voceEstaVendo')}</span>
        <Link
          href="/painel"
          className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
        >
          {t('voltarPainel')}
        </Link>
      </div>
    </div>
  )
}
