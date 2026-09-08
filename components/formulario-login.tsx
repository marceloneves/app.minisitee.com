'use client'

import { useState } from 'react'
import { Logo } from '@/components/logo'
import { useT } from '@/lib/i18n/contexto'
import { createClient } from '@/lib/supabase/client'

export function FormularioLogin() {
  const t = useT()
  const [modo, setModo] = useState<'entrar' | 'criar' | 'recuperar'>('entrar')
  const [linkEnviado, setLinkEnviado] = useState(false)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar() {
    const valor = email.trim()

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valor)) {
      setErro(t('emailInvalido'))
      return
    }
    if (modo === 'recuperar') {
      setOcupado(true)
      setErro(null)
      const base = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
      await createClient().auth.resetPasswordForEmail(valor, {
        redirectTo: `${base}/auth/recuperar`,
      })
      // Resposta igual com ou sem conta: não revela quem existe na base.
      setOcupado(false)
      setLinkEnviado(true)
      return
    }

    if (senha.length < 6) {
      setErro(modo === 'criar' ? t('senhaCurta') : t('preenchaEmailSenha'))
      return
    }

    setOcupado(true)
    setErro(null)

    const supabase = createClient()
    const { error } =
      modo === 'entrar'
        ? await supabase.auth.signInWithPassword({ email: valor, password: senha })
        : await supabase.auth.signUp({ email: valor, password: senha })

    if (error) {
      setOcupado(false)
      if (error.code === 'invalid_credentials') setErro(t('credenciaisInvalidas'))
      else if (error.code === 'user_already_exists' || error.code === 'email_exists')
        setErro(t('emailEmUso'))
      else if (error.code === 'weak_password') setErro(t('senhaCurta'))
      else setErro(`${error.status ?? '?'}: ${error.message}`)
      return
    }

    const proxima = new URLSearchParams(window.location.search).get('redirect')
    window.location.assign(proxima?.startsWith('/') ? proxima : '/painel')
  }

  const criando = modo === 'criar'
  const recuperando = modo === 'recuperar'

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6">
      <Logo className="mb-6" />

      <h1 className="text-2xl font-semibold tracking-tight">
        {recuperando ? t('recuperarTitulo') : criando ? t('criarConta') : t('entrar')}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {recuperando
          ? t('recuperarSubtitulo')
          : criando
            ? t('loginSubtituloCriar')
            : t('loginSubtituloEntrar')}
      </p>

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

      <label
        htmlFor="senha"
        className={`mt-4 block text-sm font-medium ${recuperando ? 'hidden' : ''}`}
      >
        {t('senha')}
      </label>
      <input
        id="senha"
        type="password"
        autoComplete={criando ? 'new-password' : 'current-password'}
        value={senha}
        onChange={(e) => {
          setSenha(e.target.value)
          setErro(null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !ocupado) enviar()
        }}
        disabled={ocupado}
        className={`mt-2 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-fg disabled:opacity-60 ${
          recuperando ? 'hidden' : ''
        }`}
      />

      {erro && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {erro}
        </p>
      )}
      {linkEnviado && (
        <p role="status" className="mt-2 text-sm text-green-700">
          {t('linkSenhaEnviado')}
        </p>
      )}

      <button
        type="button"
        onClick={enviar}
        disabled={ocupado}
        className="mt-6 w-full rounded-xl bg-brand px-4 py-3 text-base font-medium text-brand-fg disabled:opacity-60"
      >
        {ocupado
          ? recuperando
            ? t('enviando')
            : criando
              ? t('criandoConta')
              : t('entrando')
          : recuperando
            ? t('enviarLinkSenha')
            : criando
              ? t('criarConta')
              : t('entrar')}
      </button>

      <div className="mt-4 flex flex-col items-start gap-2">
        <button
          type="button"
          onClick={() => {
            setModo(criando || recuperando ? 'entrar' : 'criar')
            setErro(null)
            setLinkEnviado(false)
          }}
          className="text-sm text-muted underline underline-offset-4"
        >
          {criando || recuperando ? t('jaTenhoConta') : t('naoTenhoConta')}
        </button>

        {!recuperando && (
          <button
            type="button"
            onClick={() => {
              setModo('recuperar')
              setErro(null)
              setLinkEnviado(false)
            }}
            className="text-sm text-muted underline underline-offset-4"
          >
            {t('esqueciSenha')}
          </button>
        )}
      </div>
    </main>
  )
}
