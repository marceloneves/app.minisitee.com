'use client'

import { useState } from 'react'
import { LIMITE_RESPOSTA, validarRespostas, type ValorCampo } from '@/lib/formulario'
import { useT } from '@/lib/i18n/contexto'
import type { CampoFormulario, TipoCampo } from '@/lib/types'

const campoClasse =
  'mt-2 w-full rounded-xl border border-border bg-transparent px-4 py-3 text-base outline-none focus:border-fg'
const botaoPrincipal =
  'w-full rounded-xl bg-brand px-5 py-3 text-base font-semibold text-brand-fg disabled:opacity-50'
const botaoLink = 'text-sm text-muted underline underline-offset-4'
const opcaoClasse =
  'flex cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3 text-base has-[:checked]:border-fg'

const ATRIBUTOS: Partial<Record<TipoCampo, React.InputHTMLAttributes<HTMLInputElement>>> = {
  texto: { type: 'text' },
  whatsapp: { type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: '(48) 99999-9999' },
  email: { type: 'email', inputMode: 'email', autoComplete: 'email' },
  numero: { type: 'text', inputMode: 'decimal' },
  data: { type: 'date' },
}

export function FormularioPublico({
  itemId,
  campos,
  mensagemFim,
}: {
  itemId: string
  campos: CampoFormulario[]
  mensagemFim?: string
}) {
  const t = useT()
  const [valores, setValores] = useState<Record<string, ValorCampo>>({})
  const [site, setSite] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)

  function mudar(id: string, valor: ValorCampo) {
    setValores((v) => ({ ...v, [id]: valor }))
    setErro(null)
  }

  function mensagemDoErro(campo: unknown, motivo: unknown) {
    if (motivo === 'vazio') return t('formularioVazio')
    const c = campos.find((x) => x.id === campo)
    if (!c) return t('formularioErro')
    return t(motivo === 'obrigatorio' ? 'formularioObrigatorio' : 'formularioInvalido', {
      campo: c.rotulo,
    })
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()

    const validacao = validarRespostas(campos, valores)
    if (!validacao.ok) {
      setErro(mensagemDoErro(validacao.campo, validacao.motivo))
      return
    }

    setEnviando(true)
    setErro(null)
    try {
      const r = await fetch(`/api/formulario/${itemId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valores, site }),
      })
      if (r.ok) {
        setEnviado(true)
        setValores({})
      } else if (r.status === 400) {
        const corpo = await r.json().catch(() => ({}))
        setErro(mensagemDoErro(corpo.campo, corpo.motivo))
      } else {
        setErro(t(r.status === 429 ? 'formularioLimite' : 'formularioErro'))
      }
    } catch {
      setErro(t('formularioErro'))
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div className="mt-3 space-y-3 text-center">
        <p role="status" className="whitespace-pre-line text-base font-medium">
          {mensagemFim?.trim() || t('formularioMensagemPadrao')}
        </p>
        <button type="button" onClick={() => setEnviado(false)} className={botaoLink}>
          {t('formularioEnviarOutra')}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="relative mt-3 space-y-4">
      {campos.map((campo) => (
        <Campo
          key={campo.id}
          itemId={itemId}
          campo={campo}
          valor={valores[campo.id]}
          aoMudar={(v) => mudar(campo.id, v)}
        />
      ))}

      {/* Armadilha para robo: fora da tela e fora do Tab, so quem preenche tudo
          as cegas escreve aqui. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
        <label>
          Site
          <input
            tabIndex={-1}
            autoComplete="off"
            value={site}
            onChange={(e) => setSite(e.target.value)}
          />
        </label>
      </div>

      {erro && (
        <p role="alert" className="text-sm text-red-600">
          {erro}
        </p>
      )}

      <button type="submit" disabled={enviando} className={botaoPrincipal}>
        {enviando ? t('enviando') : t('formularioEnviar')}
      </button>
    </form>
  )
}

function Campo({
  itemId,
  campo: c,
  valor,
  aoMudar,
}: {
  itemId: string
  campo: CampoFormulario
  valor: ValorCampo | undefined
  aoMudar: (v: ValorCampo) => void
}) {
  const t = useT()
  const id = `formulario-${itemId}-${c.id}`
  const texto = typeof valor === 'string' ? valor : ''
  const rotulo = (
    <>
      {c.rotulo}
      {!c.obrigatorio && <span className="ml-1 font-normal text-muted">{t('opcional')}</span>}
    </>
  )

  if (c.tipo === 'uma' || c.tipo === 'varias') {
    const marcadas = Array.isArray(valor) ? valor : []
    return (
      <fieldset>
        <legend className="text-sm font-medium">{rotulo}</legend>
        <div className="mt-2 space-y-2">
          {(c.opcoes ?? []).map((opcao) => (
            <label key={opcao} className={opcaoClasse}>
              {c.tipo === 'uma' ? (
                <input
                  type="radio"
                  name={id}
                  checked={texto === opcao}
                  onChange={() => aoMudar(opcao)}
                  className="size-4 shrink-0"
                />
              ) : (
                <input
                  type="checkbox"
                  checked={marcadas.includes(opcao)}
                  onChange={(e) =>
                    aoMudar(
                      e.target.checked
                        ? [...marcadas, opcao]
                        : marcadas.filter((m) => m !== opcao)
                    )
                  }
                  className="size-4 shrink-0"
                />
              )}
              <span className="min-w-0">{opcao}</span>
            </label>
          ))}
        </div>
      </fieldset>
    )
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {rotulo}
      </label>
      {c.tipo === 'textoLongo' ? (
        <textarea
          id={id}
          value={texto}
          rows={3}
          maxLength={LIMITE_RESPOSTA.textoLongo}
          onChange={(e) => aoMudar(e.target.value)}
          className={campoClasse}
        />
      ) : (
        <input
          id={id}
          value={texto}
          maxLength={LIMITE_RESPOSTA[c.tipo]}
          onChange={(e) => aoMudar(e.target.value)}
          className={campoClasse}
          {...ATRIBUTOS[c.tipo]}
        />
      )}
    </div>
  )
}
