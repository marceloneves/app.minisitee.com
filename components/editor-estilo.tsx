'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { atualizarEstilo } from '@/lib/actions/profile'
import { useIdioma, useT } from '@/lib/i18n/contexto'
import { ROTULO_ESTILO } from '@/lib/i18n/dicionarios'
import { ESTILOS, imagemEstilo } from '@/lib/types'

export function EditorEstilo({
  inicial,
  previa,
}: {
  inicial: string
  previa?: React.ReactNode
}) {
  const t = useT()
  const idioma = useIdioma()
  const router = useRouter()
  const [tema, setTema] = useState(inicial)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, iniciar] = useTransition()

  function salvar() {
    setErro(null)
    iniciar(async () => {
      const r = await atualizarEstilo(tema)
      if ('erro' in r && r.erro) {
        setErro(r.erro)
        return
      }
      router.push('/painel')
      router.refresh()
    })
  }

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ESTILOS.map(({ valor, superficie, marca }) => {
          // Nos estilos com foto a amostra mostra a propria foto, na versao de
          // 320px: a cor sozinha nao diria nada sobre o que a pessoa vai levar.
          const miniatura = imagemEstilo(valor, true)
          return (
          <li key={valor}>
            <button
              type="button"
              onClick={() => setTema(valor)}
              aria-pressed={tema === valor}
              className={`w-full overflow-hidden rounded-xl border-2 text-left transition-colors ${
                tema === valor ? 'border-fg' : 'border-border hover:border-muted'
              }`}
            >
              <span
                className="flex h-20 items-end gap-1.5 bg-cover bg-center p-2"
                style={{
                  background: superficie,
                  backgroundImage: miniatura ? `url(${miniatura})` : undefined,
                }}
              >
                <span
                  className="h-3 w-12 rounded-full"
                  style={{ background: marca }}
                />
                <span
                  className="h-3 w-6 rounded-full"
                  style={{ background: marca, opacity: 0.35 }}
                />
              </span>
              <span className="block px-2 py-2 text-sm font-medium">{ROTULO_ESTILO[idioma][valor]}</span>
            </button>
          </li>
          )
        })}
      </ul>

      {erro && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={salvar}
        disabled={salvando || tema === inicial}
        className="mt-6 w-full rounded-xl bg-brand px-4 py-3 text-base font-medium text-brand-fg disabled:opacity-50"
      >
        {salvando ? t('salvando') : t('salvar')}
      </button>

      {previa && (
        <div
          data-tema={tema}
          className={`mt-8 overflow-hidden rounded-2xl border border-border bg-bg text-fg${
            imagemEstilo(tema) ? ' fundo-estilo-previa' : ''
          }`}
        >
          {previa}
        </div>
      )}
    </div>
  )
}
