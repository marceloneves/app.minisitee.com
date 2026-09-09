'use client'

import { useState } from 'react'
import { Logo } from '@/components/logo'
import { useT } from '@/lib/i18n/contexto'
import { basePainel } from '@/lib/site'
import { createClient } from '@/lib/supabase/client'

export function FormularioLogin() {
  const t = useT()
  const [modo, setModo] = useState<'entrar' | 'criar' | 'recuperar'>('entrar')
  const [linkEnviado, setLinkEnviado] = useState(false)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [senhaVisivel, setSenhaVisivel] = useState(false)
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
      const base = basePainel(window.location.origin)
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

    // Entrar abre sempre a edicao do minisitee, mesmo para quem chegou no
    // login vindo de uma tela mais funda do painel.
    window.location.assign('/painel')
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
      <div className={`relative mt-2 ${recuperando ? 'hidden' : ''}`}>
        <input
          id="senha"
          type={senhaVisivel ? 'text' : 'password'}
          autoComplete={criando ? 'new-password' : 'current-password'}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={senha}
          onChange={(e) => {
            setSenha(e.target.value)
            setErro(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !ocupado) enviar()
          }}
          disabled={ocupado}
          className="w-full rounded-xl border border-border bg-bg py-3 pl-4 pr-12 text-base outline-none focus:border-fg disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => setSenhaVisivel((v) => !v)}
          aria-label={senhaVisivel ? t('ocultarSenha') : t('mostrarSenha')}
          aria-pressed={senhaVisivel}
          title={senhaVisivel ? t('ocultarSenha') : t('mostrarSenha')}
          disabled={ocupado}
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
            {senhaVisivel ? (
              <>
                <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
                <circle cx="12" cy="12" r="2.75" />
                <path d="m4 20 16-16" />
              </>
            ) : (
              <>
                <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
                <circle cx="12" cy="12" r="2.75" />
              </>
            )}
          </svg>
        </button>
      </div>

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
