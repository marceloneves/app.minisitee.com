'use client'

import { useT } from '@/lib/i18n/contexto'

export type Situacao = 'parado' | 'salvando' | 'salvo' | 'erro' | 'falta'

// Aviso das telas que salvam sozinhas (estilo e perfil). O cabecalho do painel
// ja fica preso no topo; o aviso flutua embaixo, onde nao some atras dele
// enquanto a pessoa rola. `mensagem` e o erro ou, em 'falta', o que precisa
// ser preenchido antes de salvar.
export function AvisoSalvamento({
  situacao,
  mensagem,
}: {
  situacao: Situacao
  mensagem?: string | null
}) {
  const t = useT()
  const cor =
    situacao === 'erro'
      ? 'bg-red-600 text-white'
      : situacao === 'falta'
        ? 'bg-amber-400 text-amber-950'
        : 'bg-fg text-bg'
  return (
    <p
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-0 bottom-4 z-20 mx-auto w-fit max-w-[calc(100%-2rem)] rounded-full px-4 py-2 text-center text-sm font-medium shadow-lg transition-opacity ${
        situacao === 'parado' ? 'opacity-0' : 'opacity-100'
      } ${cor}`}
    >
      {situacao === 'salvando'
        ? t('salvando')
        : situacao === 'salvo'
          ? t('salvo')
          : situacao === 'erro'
            ? (mensagem ?? t('erroSalvar'))
            : situacao === 'falta'
              ? mensagem
              : ''}
    </p>
  )
}
