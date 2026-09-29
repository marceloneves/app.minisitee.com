'use client'

import { useEffect, useRef, useState } from 'react'
import { AvisoSalvamento, type Situacao } from '@/components/aviso-salvamento'
import { atualizarProfile } from '@/lib/actions/profile'
import { MAX_BIO } from '@/lib/constants'
import { AvatarUploader } from '@/components/avatar-uploader'
import { CampoTelefone } from '@/components/campo-telefone'
import { IDIOMAS } from '@/lib/i18n/dicionarios'
import { juntarTelefone, separarTelefone } from '@/lib/paises'
import { useT } from '@/lib/i18n/contexto'

export type PerfilForm = {
  username: string
  avatarUrl: string | null
  avatarFormato: string
  displayName: string
  headline: string
  bio: string
  city: string
  whatsapp: string
  locale: string
  plan: string
}


// O que vai para atualizarProfile, com o WhatsApp ja em digitos (null quando
// incompleto). Comparar isto, e nao o formulario, evita salvar de novo so
// porque a mascara do telefone mudou a forma do texto.
function dadosParaSalvar(f: PerfilForm) {
  const { dial, nacional } = separarTelefone(f.whatsapp)
  return {
    displayName: f.displayName,
    headline: f.headline,
    bio: f.bio,
    city: f.city,
    whatsapp: juntarTelefone(dial, nacional),
    locale: f.locale,
  }
}

export function EditorPerfil({
  inicial,
  email,
}: {
  inicial: PerfilForm
  email: string | null
}) {
  const t = useT()
  const [form, setForm] = useState(inicial)
  const [erro, setErro] = useState<string | null>(null)
  const [situacao, setSituacao] = useState<Situacao>('parado')

  function mudar<K extends keyof PerfilForm>(campo: K, valor: PerfilForm[K]) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  const dados = JSON.stringify(dadosParaSalvar(form))
  const ultimoSalvo = useRef(JSON.stringify(dadosParaSalvar(inicial)))
  const pedido = useRef(0)

  // A bio e obrigatoria: e o texto que sempre aparece no minisite. Enquanto
  // algo obrigatorio esta incompleto nada vai para o banco, e o aviso diz o que
  // falta; assim o minisite nunca fica com bio vazia ou WhatsApp quebrado.
  const falta =
    form.displayName.trim().length <= 1
      ? t('perfFaltaNome')
      : !form.bio.trim()
        ? t('perfFaltaBio')
        : JSON.parse(dados).whatsapp === null
          ? t('perfFaltaWhatsapp')
          : null
  const mudou = dados !== ultimoSalvo.current

  // Salva sozinho, sem botao: um segundo depois da ultima mudanca. Resposta de
  // um pedido antigo que chega depois de um novo e ignorada.
  useEffect(() => {
    if (dados === ultimoSalvo.current || falta) return
    const espera = setTimeout(async () => {
      const id = ++pedido.current
      setSituacao('salvando')
      const r = await atualizarProfile(JSON.parse(dados))
      if (id !== pedido.current) return
      if ('erro' in r && r.erro) {
        setErro(r.erro)
        setSituacao('erro')
        return
      }
      ultimoSalvo.current = dados
      setErro(null)
      setSituacao('salvo')
      setTimeout(() => {
        if (id === pedido.current) setSituacao('parado')
      }, 2000)
    }, 1000)
    return () => clearTimeout(espera)
  }, [dados, falta])

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted">{t('seusDados')}</h2>

        <p className="text-xs text-muted">{t('estSalvaSozinho')}</p>

        <AvatarUploader inicial={inicial.avatarUrl} formatoInicial={inicial.avatarFormato} />

        {/* So leitura: o e-mail e o do login e nao se troca por aqui. */}
        {email && (
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              readOnly
              className="mt-2 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base text-muted outline-none"
            />
          </div>
        )}

        <Campo
          id="nome"
          rotulo={t('nome')}
          valor={form.displayName}
          aoMudar={(v) => mudar('displayName', v)}
        />
        <Campo
          id="cidade"
          rotulo={t('cidade')}
          opcional
          valor={form.city}
          aoMudar={(v) => mudar('city', v)}
        />

        <div>
          <label htmlFor="bio" className="block text-sm font-medium">
            {t('bio')}
          </label>
          <textarea
            id="bio"
            value={form.bio}
            onChange={(e) => mudar('bio', e.target.value)}
            rows={3}
            maxLength={MAX_BIO}
            aria-describedby="bio-ajuda"
            className="mt-2 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-fg"
          />
          <p id="bio-ajuda" className="mt-2 flex justify-between gap-4 text-xs text-muted">
            <span>{t('bioAjuda')}</span>
            <span>{form.bio.length}/{MAX_BIO}</span>
          </p>
        </div>

        <CampoTelefone
          id="whatsapp"
          rotulo={t('whatsapp')}
          valor={form.whatsapp}
          aoMudar={(v) => mudar('whatsapp', v)}
        />

        <div>
          <label htmlFor="idioma" className="block text-sm font-medium">
            {t('idioma')}
          </label>
          <select
            id="idioma"
            value={form.locale}
            onChange={(e) => mudar('locale', e.target.value)}
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
          <span className="block text-sm font-medium">{t('enderecoSite')}</span>
          <p className="mt-2 rounded-xl border border-border bg-surface px-4 py-3 text-base">
            minisitee.com/
            <span className="font-medium">{inicial.username}</span>
          </p>
          <p className="mt-2 text-xs text-muted">{t('enderecoFixo')}</p>
        </div>
      </section>

      <AvisoSalvamento
        situacao={falta && mudou ? 'falta' : situacao}
        mensagem={falta && mudou ? falta : erro}
      />
    </div>
  )
}


function Campo({
  id,
  rotulo,
  valor,
  aoMudar,
  placeholder,
  opcional,
}: {
  id: string
  rotulo: string
  valor: string
  aoMudar: (v: string) => void
  placeholder?: string
  opcional?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {rotulo}
        {opcional && <span className="ml-1 font-normal text-muted">(opcional)</span>}
      </label>
      <input
        id={id}
        value={valor}
        placeholder={placeholder}
        onChange={(e) => aoMudar(e.target.value)}
        className="mt-2 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-fg"
      />
    </div>
  )
}
