'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CampoSenha } from '@/components/campo-senha'
import { Logo } from '@/components/logo'
import { useT } from '@/lib/i18n/contexto'
import { basePainel } from '@/lib/site'
import { createClient } from '@/lib/supabase/client'

// So entrar e recuperar a senha. Criar conta tem pagina propria: /cadastro.
export function FormularioLogin() {
  const t = useT()
  const [recuperando, setRecuperando] = useState(false)
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
    if (recuperando) {
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
      setErro(t('preenchaEmailSenha'))
      return
    }

    setOcupado(true)
    setErro(null)

    const { error } = await createClient().auth.signInWithPassword({
      email: valor,
      password: senha,
    })

    if (error) {
      setOcupado(false)
      if (error.code === 'invalid_credentials') setErro(t('credenciaisInvalidas'))
      else setErro(`${error.status ?? '?'}: ${error.message}`)
      return
    }

    // Entrar abre sempre a edicao do minisitee, mesmo para quem chegou no
    // login vindo de uma tela mais funda do painel.
    window.location.assign('/painel')
  }

  function trocarModo(recuperar: boolean) {
    setRecuperando(recuperar)
    setErro(null)
    setLinkEnviado(false)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6">
      <Logo className="mb-6" />

      <h1 className="text-2xl font-semibold tracking-tight">
        {recuperando ? t('recuperarTitulo') : t('entrar')}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {recuperando ? t('recuperarSubtitulo') : t('loginSubtituloEntrar')}
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
        onKeyDown={(e) => {
          if (e.key === 'Enter' && recuperando && !ocupado) enviar()
        }}
        disabled={ocupado}
        className="mt-2 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-fg disabled:opacity-60"
      />

      {!recuperando && (
        <CampoSenha
          id="senha"
          rotulo={t('senha')}
          valor={senha}
          aoMudar={(v) => {
            setSenha(v)
            setErro(null)
          }}
          aoEnter={enviar}
          autoComplete="current-password"
          desativado={ocupado}
        />
      )}

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
            : t('entrando')
          : recuperando
            ? t('enviarLinkSenha')
            : t('entrar')}
      </button>

      <div className="mt-4 flex flex-col items-start gap-2">
        {recuperando ? (
          <button
            type="button"
            onClick={() => trocarModo(false)}
            className="text-sm text-muted underline underline-offset-4"
          >
            {t('voltarParaEntrar')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => trocarModo(true)}
            className="text-sm text-muted underline underline-offset-4"
          >
            {t('esqueciSenha')}
          </button>
        )}
      </div>

      <p className="mt-8 border-t border-border pt-6 text-center text-sm text-muted">
        {t('aindaNaoTemConta')}{' '}
        <Link href="/cadastro" className="font-medium text-fg underline underline-offset-4">
          {t('naoTenhoConta')}
        </Link>
      </p>
      <p className="mt-8 text-center text-xs text-muted">
        {t('versao', { n: process.env.NEXT_PUBLIC_VERSAO ?? '' })}
      </p>
    </main>
  )
}
