'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/lib/i18n/contexto'

export function EnderecoCopiavel({ username }: { username: string }) {
  const t = useT()
  const [estado, setEstado] = useState<'parado' | 'copiado' | 'erro'>('parado')

  useEffect(() => {
    if (estado === 'parado') return
    const id = setTimeout(() => setEstado('parado'), 2000)
    return () => clearTimeout(id)
  }, [estado])

  async function copiar() {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
    try {
      await navigator.clipboard.writeText(`${base}/${username}`)
      setEstado('copiado')
    } catch {
      setEstado('erro')
    }
  }

  return (
    <span className="block">
      <button
        type="button"
        onClick={copiar}
        aria-label={t('copiarEndereco')}
        title={t('copiarEndereco')}
        className="flex max-w-full items-center gap-1 text-xs text-muted hover:text-fg"
      >
        <span className="truncate">minisitee.com/{username}</span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-3.5 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {estado === 'copiado' ? (
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          ) : (
            <>
              <rect x="9" y="9" width="11" height="11" rx="2.5" />
              <path d="M5.5 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v.5" />
            </>
          )}
        </svg>
      </button>

      <span role="status" aria-live="polite" className="block text-xs">
        {estado === 'copiado' && (
          <span className="text-green-600">{t('copiado')}</span>
        )}
        {estado === 'erro' && <span className="text-red-600">{t('falhaCopiar')}</span>}
      </span>
    </span>
  )
}
