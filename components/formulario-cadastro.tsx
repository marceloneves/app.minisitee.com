'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CampoSenha } from '@/components/campo-senha'
import { Logo } from '@/components/logo'
import { useT } from '@/lib/i18n/contexto'
import { createClient } from '@/lib/supabase/client'

export function FormularioCadastro() {
  const t = useT()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar() {
    const valor = email.trim()

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valor)) {
      setErro(t('emailInvalido'))
      return
    }
    if (senha.length < 6) {
      setErro(t('senhaCurta'))
      return
    }
    if (senha !== confirmacao) {
      setErro(t('senhasDiferentes'))
      return
    }

    setOcupado(true)
    setErro(null)

    const { error } = await createClient().auth.signUp({ email: valor, password: senha })

    if (error) {
      setOcupado(false)
      if (error.code === 'user_already_exists' || error.code === 'email_exists')
        setErro(t('emailEmUso'))
      else if (error.code === 'weak_password') setErro(t('senhaCurta'))
      else setErro(`${error.status ?? '?'}: ${error.message}`)
      return
    }

    window.location.assign('/painel')
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6">
      <Logo className="mb-6" />

      <h1 className="text-2xl font-semibold tracking-tight">{t('criarConta')}</h1>
      <p className="mt-2 text-sm text-muted">{t('loginSubtituloCriar')}</p>

      <label htmlFor="email" className="mt-8 block text-sm font-medium">
        {t('email')}
      </label>
      <input
        id="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        placeholder="voce@email.com.br"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          setErro(null)
        }}
        disabled={ocupado}
        className="mt-2 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-fg disabled:opacity-60"
      />

      <CampoSenha
        id="senha"
        rotulo={t('senha')}
        valor={senha}
        aoMudar={(v) => {
          setSenha(v)
          setErro(null)
        }}
        aoEnter={enviar}
        autoComplete="new-password"
        desativado={ocupado}
      />
      <CampoSenha
        id="confirmacao"
        rotulo={t('confirmarSenha')}
        valor={confirmacao}
        aoMudar={(v) => {
          setConfirmacao(v)
          setErro(null)
        }}
        aoEnter={enviar}
        autoComplete="new-password"
        desativado={ocupado}
      />

      {erro && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={enviar}
        disabled={ocupado}
        className="mt-6 w-full rounded-xl bg-brand px-4 py-3 text-base font-medium text-brand-fg disabled:opacity-60"
      >
        {ocupado ? t('criandoConta') : t('criarConta')}
      </button>

      <p className="mt-8 border-t border-border pt-6 text-center text-sm text-muted">
        {t('jaTemConta')}{' '}
        <Link href="/login" className="font-medium text-fg underline underline-offset-4">
          {t('entrar')}
        </Link>
      </p>
      <p className="mt-8 text-center text-xs text-muted">
        {t('versao', { n: process.env.NEXT_PUBLIC_VERSAO ?? '' })}
      </p>
    </main>
  )
}
