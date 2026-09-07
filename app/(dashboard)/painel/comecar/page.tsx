'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  criarProfile,
  verificarUsername,
  type DisponibilidadeUsername,
} from '@/lib/actions/profile'
import { CampoTelefone } from '@/components/campo-telefone'
import { juntarTelefone, separarTelefone } from '@/lib/paises'
import { slugify } from '@/lib/slug'
import { ProvedorIdioma, useIdioma, useT } from '@/lib/i18n/contexto'
import { IDIOMAS, type Idioma } from '@/lib/i18n/dicionarios'

type Checagem = DisponibilidadeUsername | { status: 'verificando' } | null

export default function ComecarPage() {
  const detectado = useIdioma()
  const [idioma, setIdioma] = useState<Idioma>(detectado)

  return (
    <ProvedorIdioma idioma={idioma}>
      <FormularioComecar idioma={idioma} aoTrocarIdioma={setIdioma} />
    </ProvedorIdioma>
  )
}

function FormularioComecar({
  idioma,
  aoTrocarIdioma,
}: {
  idioma: Idioma
  aoTrocarIdioma: (v: Idioma) => void
}) {
  const t = useT()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [headline, setHeadline] = useState('')
  const [city, setCity] = useState('')
  const [whatsapp, setWhatsapp] = useState('55')
  const [checagem, setChecagem] = useState<Checagem>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, iniciarSalvamento] = useTransition()

  const pedido = useRef(0)

  useEffect(() => {
    const valor = username.trim().toLowerCase()
    if (!valor) {
      setChecagem(null)
      return
    }

    setChecagem({ status: 'verificando' })
    const id = ++pedido.current

    const timer = setTimeout(async () => {
      const resultado = await verificarUsername(valor)
      if (id === pedido.current) setChecagem(resultado)
    }, 500)

    return () => clearTimeout(timer)
  }, [username])

  const { dial, nacional } = separarTelefone(whatsapp)
  const digitos = juntarTelefone(dial, nacional)

  const faltando: string[] = []
  if (checagem?.status !== 'livre') {
    faltando.push(
      checagem?.status === 'verificando' ? t('faltaVerificando') : t('faltaEndereco')
    )
  }
  if (displayName.trim().length <= 1) faltando.push(t('faltaNome'))
  if (digitos === null) faltando.push(t('faltaWhatsapp'))

  const podeSalvar = faltando.length === 0 && !salvando

  function salvar() {
    if (!podeSalvar || !digitos) return
    setErro(null)

    iniciarSalvamento(async () => {
      const resultado = await criarProfile({
        username: username.trim().toLowerCase(),
        displayName,
        headline,
        city,
        whatsapp: digitos,
        locale: idioma,
      })

      if ('erro' in resultado && resultado.erro) {
        setErro(resultado.erro)
        if (resultado.erro === 'Esse endereço não está disponível') {
          setChecagem({ status: 'ocupado' })
        }
        return
      }

      router.replace('/painel')
      router.refresh()
    })
  }

  return (
    <main className="mx-auto w-full max-w-md px-5 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t('vamosCriar')}</h1>
      <p className="mt-2 text-sm text-muted">
        {t('levaUmMinuto')}
      </p>

      <div className="mt-8 space-y-6">
        <div>
          <label htmlFor="idioma" className="block text-sm font-medium">
            {t('idioma')}
          </label>
          <select
            id="idioma"
            value={idioma}
            onChange={(e) => aoTrocarIdioma(e.target.value as Idioma)}
            className="mt-2 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-fg"
          >
            {IDIOMAS.map(([v, nome]) => (
              <option key={v} value={v}>
                {nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium">
            {t('seuEndereco')}
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(slugify(e.target.value))}
            placeholder="seunome"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            className="mt-2 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-fg"
          />
          <p className="mt-2 text-sm text-muted">
            minisitee.com/
            <span className="font-medium text-fg">{username || 'seunome'}</span>
          </p>
          <StatusUsername checagem={checagem} />
        </div>

        <Campo
          id="nome"
          rotulo={t('nomeCompleto')}
          valor={displayName}
          aoMudar={setDisplayName}
          placeholder="João da Silva"
          autoComplete="name"
        />

        <Campo
          id="headline"
          rotulo={t('oQueVoceFaz')}
          opcional
          valor={headline}
          aoMudar={setHeadline}
          placeholder="Confeiteira, Personal trainer, Corretora..."
        />

        <Campo
          id="cidade"
          rotulo={t('cidade')}
          opcional
          valor={city}
          aoMudar={setCity}
          placeholder="Florianópolis"
          autoComplete="address-level2"
        />

        <CampoTelefone
          id="whatsapp"
          rotulo={t('whatsapp')}
          ajuda={t('whatsappAjuda')}
          valor={whatsapp}
          aoMudar={setWhatsapp}
        />
      </div>

      {erro && (
        <p role="alert" className="mt-6 text-sm text-red-600">
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={salvar}
        disabled={!podeSalvar}
        className="mt-8 w-full rounded-xl bg-brand px-4 py-3 text-base font-medium text-brand-fg disabled:opacity-50"
      >
        {salvando ? t('criando') : t('criarMeuSite')}
      </button>

      {faltando.length > 0 && (
        <p className="mt-3 text-center text-xs text-muted">
          {t('falta', { itens: faltando.join(', ') })}
        </p>
      )}
    </main>
  )
}

function StatusUsername({ checagem }: { checagem: Checagem }) {
  const t = useT()
  if (!checagem) return null

  if (checagem.status === 'verificando') {
    return <p className="mt-1 text-sm text-muted">{t('verificando')}</p>
  }
  if (checagem.status === 'livre') {
    return <p className="mt-1 text-sm text-green-600">{t('disponivel')}</p>
  }
  if (checagem.status === 'ocupado') {
    return (
      <p className="mt-1 text-sm text-red-600">{t('indisponivel')}</p>
    )
  }
  if (checagem.status === 'invalido') {
    return <p className="mt-1 text-sm text-red-600">{checagem.motivo}</p>
  }
  return (
<p className="mt-1 text-sm text-muted">{t('erroVerificar')}</p>
  )
}

function Campo({
  id,
  rotulo,
  valor,
  aoMudar,
  placeholder,
  opcional,
  autoComplete,
}: {
  id: string
  rotulo: string
  valor: string
  aoMudar: (v: string) => void
  placeholder?: string
  opcional?: boolean
  autoComplete?: string
}) {
  const t = useT()
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {rotulo}
        {opcional && <span className="ml-1 font-normal text-muted">{t('opcional')}</span>}
      </label>
      <input
        id={id}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-fg"
      />
    </div>
  )
}
