'use client'

import { useState, useTransition } from 'react'
import { abrirPortal, assinarPro } from '@/lib/actions/stripe'
import { MAX_ITENS_FREE } from '@/lib/constants'
import { useT } from '@/lib/i18n/contexto'

export function Assinatura({
  plano,
  temAssinatura,
  renovaEm,
  stripeAtivo,
  retorno,
}: {
  plano: string
  temAssinatura: boolean
  renovaEm: string | null
  stripeAtivo: boolean
  retorno: 'ok' | 'cancelada' | null
}) {
  const t = useT()
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()
  const ehPro = plano === 'pro'

  function executar(acao: () => Promise<{ erro?: string } | void>) {
    setErro(null)
    iniciar(async () => {
      const r = await acao()
      if (r && 'erro' in r && r.erro) {
        setErro(r.erro === 'stripe_indisponivel' ? t('pagamentoIndisponivel') : r.erro)
      }
    })
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-muted">{t('assinatura')}</h2>

      {retorno === 'ok' && (
        <p className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900">
          {t('assinaturaOk')}
        </p>
      )}
      {retorno === 'cancelada' && (
        <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
          {t('assinaturaCancelada')}
        </p>
      )}

      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted">{t('planoAtual')}</p>
            <p className="text-lg font-semibold">
              {ehPro ? t('planoPro') : t('planoFree')}
            </p>
          </div>
          {ehPro && (
            <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
              ✓
            </span>
          )}
        </div>

        <p className="mt-2 text-sm text-muted">
          {ehPro ? t('proAtivo') : t('freeResumo', { max: MAX_ITENS_FREE })}
        </p>

        {ehPro && renovaEm && (
          <p className="mt-1 text-xs text-muted">{t('renovaEm', { data: renovaEm })}</p>
        )}

        {!ehPro && (
          <p className="mt-4 border-t border-border pt-4 text-sm">
            {t('proBeneficios')}
          </p>
        )}

        {!stripeAtivo ? (
          <p className="mt-3 text-sm text-muted">{t('pagamentoIndisponivel')}</p>
        ) : temAssinatura ? (
          <button
            type="button"
            disabled={pendente}
            onClick={() => executar(abrirPortal)}
            className="mt-3 w-full rounded-xl border border-border px-4 py-3 text-base font-medium disabled:opacity-60"
          >
            {pendente ? t('abrindoCheckout') : t('gerenciarAssinatura')}
          </button>
        ) : (
          <button
            type="button"
            disabled={pendente}
            onClick={() => executar(assinarPro)}
            className="mt-3 w-full rounded-xl bg-brand px-4 py-3 text-base font-medium text-brand-fg disabled:opacity-60"
          >
            {pendente ? t('abrindoCheckout') : t('assinarPro')}
          </button>
        )}

        {erro && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {erro}
          </p>
        )}
      </div>
    </section>
  )
}
