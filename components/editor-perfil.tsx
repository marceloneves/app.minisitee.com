'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { atualizarProfile } from '@/lib/actions/profile'
import { CampoTelefone } from '@/components/campo-telefone'
import { IDIOMAS } from '@/lib/i18n/dicionarios'
import { juntarTelefone, separarTelefone } from '@/lib/paises'
import { useT } from '@/lib/i18n/contexto'

export type PerfilForm = {
  username: string
  displayName: string
  headline: string
  bio: string
  city: string
  whatsapp: string
  locale: string
}


export function EditorPerfil({ inicial }: { inicial: PerfilForm }) {
  const t = useT()
  const router = useRouter()
  const [form, setForm] = useState(inicial)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, iniciar] = useTransition()



  function mudar<K extends keyof PerfilForm>(campo: K, valor: PerfilForm[K]) {
    setErro(null)
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  const { dial, nacional } = separarTelefone(form.whatsapp)
  const digitos = juntarTelefone(dial, nacional)
  const podeSalvar =
    form.displayName.trim().length > 1 && digitos !== null && !salvando

  function salvar() {
    if (!podeSalvar || !digitos) return

    iniciar(async () => {
      const r = await atualizarProfile({ ...form, whatsapp: digitos })
      if ('erro' in r && r.erro) {
        setErro(r.erro)
        return
      }
      router.push('/painel')
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted">{t('seusDados')}</h2>

        <Campo
          id="nome"
          rotulo={t('nome')}
          valor={form.displayName}
          aoMudar={(v) => mudar('displayName', v)}
        />
        <Campo
          id="headline"
          rotulo={t('oQueVoceFaz')}
          opcional
          valor={form.headline}
          aoMudar={(v) => mudar('headline', v)}
          placeholder="Confeiteira, Personal trainer..."
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
            {t('bio')} <span className="font-normal text-muted">{t('opcional')}</span>
          </label>
          <textarea
            id="bio"
            value={form.bio}
            onChange={(e) => mudar('bio', e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-fg"
          />
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



      {erro && (
        <p role="alert" className="text-sm text-red-600">
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={salvar}
        disabled={!podeSalvar}
        className="w-full rounded-xl bg-brand px-4 py-3 text-base font-medium text-brand-fg disabled:opacity-50"
      >
        {salvando ? t('salvando') : t('salvar')}
      </button>
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
