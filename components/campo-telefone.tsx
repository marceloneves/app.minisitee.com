'use client'

import { useState } from 'react'
import { formatarNacional, PAISES, separarTelefone, juntarTelefone } from '@/lib/paises'

export function CampoTelefone({
  id,
  rotulo,
  ajuda,
  valor,
  aoMudar,
}: {
  id: string
  rotulo: string
  ajuda?: string
  valor: string
  aoMudar: (digitos: string) => void
}) {
  const inicial = separarTelefone(valor)
  const [dial, setDial] = useState(inicial.dial)
  const [nacional, setNacional] = useState(inicial.nacional)

  const pais = PAISES.find(([, d]) => d === dial)

  function emitir(novoDial: string, novoNacional: string) {
    setDial(novoDial)
    setNacional(novoNacional)
    aoMudar(`${novoDial}${novoNacional}`)
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {rotulo}
      </label>

      <div className="mt-2 flex gap-2">
        <div className="flex w-24 shrink-0 items-center rounded-xl border border-border bg-bg focus-within:border-fg">
          <span className="pl-3 text-base text-muted">+</span>
          <input
            aria-label="Código do país"
            value={dial}
            onChange={(e) => emitir(e.target.value.replace(/\D/g, '').slice(0, 4), nacional)}
            inputMode="numeric"
            list="codigos-pais"
            placeholder="55"
            className="w-full bg-transparent px-1.5 py-3 text-base outline-none"
          />
        </div>

        <input
          id={id}
          value={formatarNacional(dial, nacional)}
          onChange={(e) => emitir(dial, e.target.value.replace(/\D/g, ''))}
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={dial === '55' ? '(48) 99999-8888' : '999999999'}
          className="min-w-0 flex-1 rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-fg"
        />
      </div>

      <datalist id="codigos-pais">
        {PAISES.map(([iso, d, nome]) => (
          <option key={iso} value={d}>
            {nome}
          </option>
        ))}
      </datalist>

      <p className="mt-2 text-xs text-muted">
        {pais ? pais[2] : `+${dial || '—'}`}
        {ajuda ? ` · ${ajuda}` : ''}
      </p>
    </div>
  )
}

export { juntarTelefone }
