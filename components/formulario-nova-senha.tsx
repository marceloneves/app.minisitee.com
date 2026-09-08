'use client'

import { useState } from 'react'
import { Logo } from '@/components/logo'
import { useT } from '@/lib/i18n/contexto'
import { createClient } from '@/lib/supabase/client'

export function FormularioNovaSenha() {
  const t = useT()
  const [senha, setSenha] = useState('')
  const [estado, setEstado] = useState<'parado' | 'salvando' | 'ok'>('parado')
  const [erro, setErro] = useState<string | null>(null)

  async function salvar() {
    if (senha.length < 6) {
      setErro(t('senhaCurta'))
      return
    }

    setEstado('salvando')
    setErro(null)

    const { error } = await createClient().auth.updateUser({ password: senha })

    if (error) {
      setEstado('parado')
      setErro(error.message)
      return
    }

    setEstado('ok')
    window.location.assign('/painel')
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6">
      <Logo className="mb-6" />
      <h1 className="text-2xl font-semibold tracking-tight">{t('novaSenhaTitulo')}</h1>

      <label htmlFor="senha" className="mt-8 block text-sm font-medium">
        {t('novaSenha')}
      </label>
      <input
        id="senha"
        type="password"
        autoComplete="new-password"
        value={senha}
        onChange={(e) => {
          setSenha(e.target.value)
          setErro(null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && estado === 'parado') salvar()
        }}
        disabled={estado !== 'parado'}
        className="mt-2 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-fg disabled:opacity-60"
      />

      {erro && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {erro}
        </p>
      )}
      {estado === 'ok' && (
        <p className="mt-2 text-sm text-green-700">{t('senhaSalva')}</p>
      )}

      <button
        type="button"
        onClick={salvar}
        disabled={estado !== 'parado'}
        className="mt-6 w-full rounded-xl bg-brand px-4 py-3 text-base font-medium text-brand-fg disabled:opacity-60"
      >
        {estado === 'salvando' ? t('salvando') : t('salvarSenha')}
      </button>
    </main>
  )
}
