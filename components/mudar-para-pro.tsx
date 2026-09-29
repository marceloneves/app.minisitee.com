'use client'

import { useState, useTransition } from 'react'
import { assinarPro } from '@/lib/actions/stripe'
import { MAX_ITENS_FREE } from '@/lib/constants'
import { useT } from '@/lib/i18n/contexto'

export function MudarParaPro({ ehPro, stripeAtivo }: { ehPro: boolean; stripeAtivo: boolean }) {
  const t = useT()
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()

  // Em sucesso a acao redireciona para o checkout da Stripe.
  function assinar() {
    setErro(null)
    iniciar(async () => {
      const r = await assinarPro()
      if (r && 'erro' in r && r.erro) {
        setErro(r.erro === 'stripe_indisponivel' ? t('pagamentoIndisponivel') : r.erro)
      }
    })
  }

  const linhas: [string, string, string][] = [
    [t('proItemFerramentas'), t('proAte', { max: MAX_ITENS_FREE }), t('proIlimitadas')],
    [t('proItemMarca'), t('proSim'), t('proNao')],
    [t('proItemAgenda'), t('proNao'), t('proSim')],
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('proTitulo')}</h1>
        <p className="mt-1 text-sm text-muted">{t('proSubtitulo')}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="grid grid-cols-[1fr_auto_auto] bg-surface text-sm font-semibold">
          <span className="px-4 py-3" />
          <span className="w-20 px-2 py-3 text-center">{t('planoFree')}</span>
          <span className="w-24 bg-fg px-2 py-3 text-center text-bg">{t('planoPro')}</span>
        </div>
        {linhas.map(([item, free, pro]) => (
          <div
            key={item}
            className="grid grid-cols-[1fr_auto_auto] items-center border-t border-border text-sm"
          >
            <span className="px-4 py-3">{item}</span>
            <span className="w-20 px-2 py-3 text-center text-muted">{free}</span>
            <span className="w-24 px-2 py-3 text-center font-semibold">{pro}</span>
          </div>
        ))}
      </div>

      {ehPro ? (
        <p className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900">
          {t('proJaE')}
        </p>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            onClick={assinar}
            disabled={pendente || !stripeAtivo}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-fg px-5 text-base font-semibold text-bg disabled:opacity-50"
          >
            {pendente ? t('abrindoCheckout') : t('assinarPro')}
          </button>
          {!stripeAtivo && <p className="text-sm text-muted">{t('pagamentoIndisponivel')}</p>}
          {erro && (
            <p role="alert" className="text-sm text-red-600">
              {erro}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
