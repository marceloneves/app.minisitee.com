'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n/contexto'

export function CampoSenha({
  id,
  rotulo,
  valor,
  aoMudar,
  aoEnter,
  autoComplete,
  desativado,
}: {
  id: string
  rotulo: string
  valor: string
  aoMudar: (v: string) => void
  aoEnter: () => void
  autoComplete: 'new-password' | 'current-password'
  desativado: boolean
}) {
  const t = useT()
  const [visivel, setVisivel] = useState(false)

  return (
    <>
      <label htmlFor={id} className="mt-4 block text-sm font-medium">
        {rotulo}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          type={visivel ? 'text' : 'password'}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !desativado) aoEnter()
          }}
          disabled={desativado}
          className="w-full rounded-xl border border-border bg-bg py-3 pl-4 pr-12 text-base outline-none focus:border-fg disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? t('ocultarSenha') : t('mostrarSenha')}
          aria-pressed={visivel}
          title={visivel ? t('ocultarSenha') : t('mostrarSenha')}
          disabled={desativado}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted hover:text-fg disabled:opacity-60"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
            <circle cx="12" cy="12" r="2.75" />
            {visivel && <path d="m4 20 16-16" />}
          </svg>
        </button>
      </div>
    </>
  )
}
