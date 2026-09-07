'use client'

import { useEffect, useState } from 'react'
import { UNIDADES_TEMPO, type Idioma } from '@/lib/i18n/dicionarios'

function restante(alvo: string) {
  const fim = new Date(alvo).getTime()
  if (Number.isNaN(fim)) return null

  const ms = fim - Date.now()
  if (ms <= 0) return null

  return {
    dias: Math.floor(ms / 86400000),
    horas: Math.floor((ms / 3600000) % 24),
    minutos: Math.floor((ms / 60000) % 60),
    segundos: Math.floor((ms / 1000) % 60),
  }
}

export function ContagemRegressiva({
  alvo,
  textoFim,
  idioma,
}: {
  alvo: string
  textoFim: string
  idioma: Idioma
}) {
  const unidades = UNIDADES_TEMPO[idioma]
  const [tempo, setTempo] = useState<ReturnType<typeof restante> | undefined>(
    undefined
  )

  useEffect(() => {
    setTempo(restante(alvo))
    const id = setInterval(() => setTempo(restante(alvo)), 1000)
    return () => clearInterval(id)
  }, [alvo])

  if (tempo === undefined) {
    return <p className="mt-2 text-center text-base text-muted">—</p>
  }

  if (tempo === null) {
    return <p className="mt-2 text-center text-lg font-semibold">{textoFim}</p>
  }

  return (
    <ul className="mt-3 flex justify-center gap-2">
      {([
        [tempo.dias, unidades[0]],
        [tempo.horas, unidades[1]],
        [tempo.minutos, unidades[2]],
        [tempo.segundos, unidades[3]],
      ] as const).map(([valor, rotulo]) => (
        <li
          key={rotulo}
          className="min-w-16 rounded-xl border border-border px-2 py-2 text-center"
        >
          <span className="block text-xl font-bold tabular-nums">
            {String(valor).padStart(2, '0')}
          </span>
          <span className="block text-xs text-muted">{rotulo}</span>
        </li>
      ))}
    </ul>
  )
}
