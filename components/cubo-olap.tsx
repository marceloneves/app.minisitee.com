'use client'

import { useMemo, useState } from 'react'
import {
  calcular,
  chave,
  chaveCelula,
  DIMENSOES,
  MEDIDAS,
  PADRAO,
  valoresDe,
  VAZIO,
  type Base,
  type DadosCubo,
  type LinhaFato,
  type Zonas,
} from '@/lib/cubo-modelo'

type NomeZona = keyof Zonas | 'disponiveis'

const ZONAS: { id: keyof Zonas; titulo: string; ajuda: string }[] = [
  { id: 'linhas', titulo: 'Linhas', ajuda: 'uma linha por combinação' },
  { id: 'colunas', titulo: 'Colunas', ajuda: 'uma coluna por combinação' },
  { id: 'fatias', titulo: 'Fatia', ajuda: 'recorta antes de somar' },
]

export function CuboOlap({ dados }: { dados: DadosCubo }) {
  const [base, setBase] = useState<Base>('usuarios')
  const [zonas, setZonas] = useState<Zonas>(PADRAO.usuarios.zonas)
  const [medida, setMedida] = useState(PADRAO.usuarios.medida)
  const [recorte, setRecorte] = useState<Record<string, string>>({})
  const [pego, setPego] = useState<string | null>(null)
  const [sobre, setSobre] = useState<NomeZona | null>(null)
  const [aberta, setAberta] = useState<{ l: string[]; c: string[] } | null>(null)

  const dimensoes = DIMENSOES[base]
  const medidas = MEDIDAS[base]
  const fatos = base === 'usuarios' ? dados.usuarios : dados.itens

  const usadas = new Set([...zonas.linhas, ...zonas.colunas, ...zonas.fatias])
  const disponiveis = dimensoes.filter(([v]) => !usadas.has(v))

  function trocarBase(nova: Base) {
    setBase(nova)
    setZonas(PADRAO[nova].zonas)
    setMedida(PADRAO[nova].medida)
    setRecorte({})
    setPego(null)
    setAberta(null)
  }

  // Uma dimensao vive em uma zona so: soltar em outra e mudar de lugar, nao
  // duplicar.
  function mover(dim: string, destino: NomeZona) {
    setZonas((z) => {
      const limpo: Zonas = {
        linhas: z.linhas.filter((d) => d !== dim),
        colunas: z.colunas.filter((d) => d !== dim),
        fatias: z.fatias.filter((d) => d !== dim),
      }
      if (destino !== 'disponiveis') limpo[destino] = [...limpo[destino], dim]
      return limpo
    })
    if (destino !== 'fatias') {
      setRecorte((r) => {
        const copia = { ...r }
        delete copia[dim]
        return copia
      })
    }
    setPego(null)
    setSobre(null)
    setAberta(null)
  }

  const filtrados = useMemo(() => {
    const ativos = Object.entries(recorte).filter(([, v]) => v)
    if (ativos.length === 0) return fatos
    return fatos.filter((f) => ativos.every(([d, v]) => (f.dim[d] ?? VAZIO) === v))
  }, [fatos, recorte])

  const { combosLinha, combosColuna, baldes } = useMemo(() => {
    const baldes = new Map<string, LinhaFato[]>()
    const vistasLinha = new Map<string, string[]>()
    const vistasColuna = new Map<string, string[]>()
    // Conta cada prefixo: e o que ordena os niveis sem quebrar o agrupamento.
    const peso = new Map<string, number>()

    const anotar = (valores: string[]) => {
      for (let i = 1; i <= valores.length; i++) {
        const k = chave(valores.slice(0, i))
        peso.set(k, (peso.get(k) ?? 0) + 1)
      }
    }

    for (const f of filtrados) {
      const l = valoresDe(f, zonas.linhas)
      const c = valoresDe(f, zonas.colunas)

      vistasLinha.set(chave(l), l)
      vistasColuna.set(chave(c), c)
      anotar(l)
      anotar(c)

      const k = chaveCelula(l, c)
      const balde = baldes.get(k)
      if (balde) balde.push(f)
      else baldes.set(k, [f])
    }

    const ordenar = (combos: string[][]) =>
      combos.sort((a, b) => {
        for (let i = 0; i < a.length; i++) {
          if (a[i] === b[i]) continue
          const pa = peso.get(chave(a.slice(0, i + 1))) ?? 0
          const pb = peso.get(chave(b.slice(0, i + 1))) ?? 0
          return pb - pa || a[i].localeCompare(b[i])
        }
        return 0
      })

    return {
      combosLinha: ordenar([...vistasLinha.values()]),
      combosColuna: ordenar([...vistasColuna.values()]),
      baldes,
    }
  }, [filtrados, zonas.linhas, zonas.colunas])

  const casas = medidas.find(([v]) => v === medida)?.[2] ?? 0
  const doBalde = (l: string[], c: string[]) => baldes.get(chaveCelula(l, c)) ?? []
  const valor = (l: string[], c: string[]) => calcular(medida, doBalde(l, c))

  const totalLinha = (l: string[]) =>
    calcular(
      medida,
      combosColuna.flatMap((c) => doBalde(l, c))
    )
  const totalColuna = (c: string[]) =>
    calcular(
      medida,
      combosLinha.flatMap((l) => doBalde(l, c))
    )
  const totalGeral = calcular(medida, filtrados)

  const maior = Math.max(
    ...combosLinha.flatMap((l) => combosColuna.map((c) => valor(l, c) ?? 0)),
    0
  )

  function formatar(n: number | null) {
    if (n === null) return '—'
    return n.toLocaleString('pt-BR', {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    })
  }

  function baixarCsv() {
    const titulo = (dims: string[]) => dims.map((d) => rotulo(dimensoes, d))
    const cabecalho = [
      ...(zonas.linhas.length ? titulo(zonas.linhas) : ['Total']),
      ...combosColuna.map((c) => (c.length ? c.join(' / ') : 'Total')),
      'Total',
    ]
    const corpo = combosLinha.map((l) => [
      ...(l.length ? l : ['Total']),
      ...combosColuna.map((c) => formatar(valor(l, c))),
      formatar(totalLinha(l)),
    ])
    const rodape = [
      ...(zonas.linhas.length ? zonas.linhas.map(() => '') : ['']),
      ...combosColuna.map((c) => formatar(totalColuna(c))),
      formatar(totalGeral),
    ]
    rodape[0] = 'Total'

    const csv = [cabecalho, ...corpo, rodape]
      .map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'))
      .join('\n')

    // O BOM e o que faz o Excel abrir com os acentos certos.
    const url = URL.createObjectURL(
      new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `cubo-${base}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const detalhe = aberta ? doBalde(aberta.l, aberta.c) : []
  const niveisColuna = Math.max(zonas.colunas.length, 1)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {(['usuarios', 'itens'] as const).map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => trocarBase(b)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              base === b
                ? 'border-fg bg-fg font-medium text-bg'
                : 'border-border hover:border-muted'
            }`}
          >
            {b === 'usuarios' ? 'Contas' : 'Ferramentas'}
            <span className={base === b ? 'ml-1.5 opacity-70' : 'ml-1.5 text-muted'}>
              {(b === 'usuarios' ? dados.usuarios : dados.itens).length}
            </span>
          </button>
        ))}

        <label className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-muted">Medida</span>
          <select
            value={medida}
            onChange={(e) => setMedida(e.target.value)}
            className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm"
          >
            {medidas.map(([v, r]) => (
              <option key={v} value={v}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Zona
        titulo="Dimensões"
        ajuda={pego ? 'toque aqui para tirar do eixo' : 'arraste para os eixos abaixo'}
        realce={sobre === 'disponiveis'}
        pego={pego}
        aoSoltar={(dim) => mover(dim, 'disponiveis')}
        aoEntrar={() => setSobre('disponiveis')}
        aoSair={() => setSobre(null)}
      >
        {disponiveis.map(([v, r]) => (
          <Ficha
            key={v}
            dim={v}
            rotulo={r}
            pego={pego === v}
            aoPegar={() => setPego(pego === v ? null : v)}
          />
        ))}
        {disponiveis.length === 0 && (
          <span className="text-xs text-muted">todas em uso</span>
        )}
      </Zona>

      <div className="grid gap-3 sm:grid-cols-3">
        {ZONAS.map(({ id, titulo, ajuda }) => (
          <Zona
            key={id}
            titulo={titulo}
            ajuda={ajuda}
            realce={sobre === id}
            pego={pego}
            aoSoltar={(dim) => mover(dim, id)}
            aoEntrar={() => setSobre(id)}
            aoSair={() => setSobre(null)}
          >
            {zonas[id].map((v) => (
              <Ficha
                key={v}
                dim={v}
                rotulo={rotulo(dimensoes, v)}
                pego={pego === v}
                aoPegar={() => setPego(pego === v ? null : v)}
                aoTirar={() => mover(v, 'disponiveis')}
              >
                {id === 'fatias' && (
                  <select
                    aria-label={`Valor de ${rotulo(dimensoes, v)}`}
                    value={recorte[v] ?? ''}
                    onChange={(e) => {
                      setRecorte((r) => ({ ...r, [v]: e.target.value }))
                      setAberta(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="max-w-32 rounded border border-border bg-bg px-1 py-0.5 text-xs"
                  >
                    <option value="">todos</option>
                    {[...new Set(fatos.map((f) => f.dim[v] ?? VAZIO))]
                      .sort()
                      .map((valor) => (
                        <option key={valor} value={valor}>
                          {valor}
                        </option>
                      ))}
                  </select>
                )}
              </Ficha>
            ))}
            {zonas[id].length === 0 && !pego && (
              <span className="text-xs text-muted">vazio</span>
            )}
          </Zona>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            {Array.from({ length: niveisColuna }, (_, nivel) => (
              <tr key={nivel} className="bg-surface">
                {nivel === 0 && (
                  <th
                    colSpan={Math.max(zonas.linhas.length, 1)}
                    rowSpan={niveisColuna}
                    className="border-b border-border px-3 py-2 text-left align-bottom font-semibold"
                  >
                    {zonas.linhas.map((d) => rotulo(dimensoes, d)).join(' / ') || 'Total'}
                  </th>
                )}
                {agrupar(combosColuna, nivel).map((g, i) => (
                  <th
                    key={`${g.valor}-${i}`}
                    colSpan={g.tamanho}
                    className="border-b border-l border-border px-3 py-2 text-right font-semibold"
                  >
                    {g.valor}
                  </th>
                ))}
                {nivel === 0 && (
                  <th
                    rowSpan={niveisColuna}
                    className="border-b border-l border-border px-3 py-2 text-right align-bottom font-semibold"
                  >
                    Total
                  </th>
                )}
              </tr>
            ))}
          </thead>
          <tbody>
            {combosLinha.map((l, i) => (
              <tr key={chave(l) || 'total'}>
                {(l.length ? l : ['Total']).map((v, nivel) => {
                  const anterior = combosLinha[i - 1]
                  const repete =
                    anterior !== undefined &&
                    chave(anterior.slice(0, nivel + 1)) === chave(l.slice(0, nivel + 1))
                  return (
                    <th
                      key={nivel}
                      scope="row"
                      className="border-b border-border px-3 py-2 text-left font-normal"
                    >
                      {repete ? '' : v}
                    </th>
                  )
                })}
                {combosColuna.map((c) => {
                  const v = valor(l, c)
                  const intensidade = maior > 0 && v ? Math.round((v / maior) * 60) : 0
                  const selecionada =
                    aberta !== null &&
                    chaveCelula(aberta.l, aberta.c) === chaveCelula(l, c)
                  return (
                    <td
                      key={chave(c) || 'total'}
                      className="border-b border-l border-border p-0 text-right tabular-nums"
                      style={{
                        background: `color-mix(in srgb, var(--brand) ${intensidade}%, transparent)`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setAberta(selecionada ? null : { l, c })}
                        disabled={v === null}
                        className={`w-full px-3 py-2 text-right ${
                          selecionada ? 'font-semibold underline underline-offset-4' : ''
                        } ${v === null ? 'cursor-default text-muted' : ''}`}
                      >
                        {formatar(v)}
                      </button>
                    </td>
                  )
                })}
                <td className="border-b border-l border-border px-3 py-2 text-right font-semibold tabular-nums">
                  {formatar(totalLinha(l))}
                </td>
              </tr>
            ))}
            <tr className="bg-surface">
              <th
                scope="row"
                colSpan={Math.max(zonas.linhas.length, 1)}
                className="px-3 py-2 text-left font-semibold"
              >
                Total
              </th>
              {combosColuna.map((c) => (
                <td
                  key={chave(c) || 'total'}
                  className="border-l border-border px-3 py-2 text-right font-semibold tabular-nums"
                >
                  {formatar(totalColuna(c))}
                </td>
              ))}
              <td className="border-l border-border px-3 py-2 text-right font-semibold tabular-nums">
                {formatar(totalGeral)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span>Clique em qualquer número para ver as linhas por trás dele.</span>
        <button
          type="button"
          onClick={baixarCsv}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-fg hover:border-muted"
        >
          Baixar CSV
        </button>
      </div>

      {aberta && (
        <section className="rounded-2xl border border-border">
          <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">
              {[...aberta.l, ...aberta.c].join(' · ') || 'Total'}
              <span className="ml-2 font-normal text-muted">
                {detalhe.length} {detalhe.length === 1 ? 'registro' : 'registros'}
              </span>
            </h2>
            <button
              type="button"
              onClick={() => setAberta(null)}
              className="text-sm text-muted hover:text-fg"
            >
              Fechar
            </button>
          </header>
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {detalhe.slice(0, 200).map((f) => (
              <li
                key={f.id}
                className="flex items-baseline justify-between gap-3 px-4 py-2"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">{f.rotulo}</span>
                  <span className="block truncate text-xs text-muted">{f.detalhe}</span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted">
                  {base === 'usuarios'
                    ? `${f.itens} ${f.itens === 1 ? 'ferramenta' : 'ferramentas'}`
                    : f.precoCents !== null
                      ? (f.precoCents / 100).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })
                      : 'sem preço'}
                </span>
              </li>
            ))}
          </ul>
          {detalhe.length > 200 && (
            <p className="border-t border-border px-4 py-2 text-xs text-muted">
              Mostrando os 200 primeiros.
            </p>
          )}
        </section>
      )}
    </div>
  )
}

// Agrupa combinacoes vizinhas que compartilham o mesmo caminho ate este nivel:
// e o que faz duas dimensoes em coluna virarem cabecalho de dois andares.
function agrupar(combos: string[][], nivel: number) {
  const grupos: { valor: string; tamanho: number; prefixo: string }[] = []

  for (const combo of combos) {
    if (combo.length === 0) {
      grupos.push({ valor: 'Total', tamanho: 1, prefixo: '' })
      continue
    }

    const prefixo = chave(combo.slice(0, nivel + 1))
    const ultimo = grupos.at(-1)

    if (ultimo && ultimo.prefixo === prefixo) ultimo.tamanho++
    else grupos.push({ valor: combo[nivel], tamanho: 1, prefixo })
  }

  return grupos
}

function rotulo(dimensoes: readonly (readonly [string, string])[], chave: string) {
  return dimensoes.find(([v]) => v === chave)?.[1] ?? chave
}

function Zona({
  titulo,
  ajuda,
  realce,
  pego,
  aoSoltar,
  aoEntrar,
  aoSair,
  children,
}: {
  titulo: string
  ajuda: string
  realce: boolean
  pego: string | null
  aoSoltar: (dim: string) => void
  aoEntrar: () => void
  aoSair: () => void
  children: React.ReactNode
}) {
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        aoEntrar()
      }}
      onDragLeave={aoSair}
      onDrop={(e) => {
        e.preventDefault()
        const dim = e.dataTransfer.getData('text/plain')
        if (dim) aoSoltar(dim)
      }}
      className={`rounded-xl border border-dashed p-3 transition-colors ${
        realce ? 'border-fg bg-surface' : 'border-border'
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold">{titulo}</span>
        <span className="text-[11px] text-muted">{ajuda}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">{children}</div>

      {/* No celular nao existe arrastar: a ficha e "pega" no toque e este botao
          e onde ela pousa. Serve tambem para quem usa teclado. */}
      {pego && (
        <button
          type="button"
          onClick={() => aoSoltar(pego)}
          className="mt-2 w-full rounded-lg border border-fg px-2 py-1.5 text-xs font-medium"
        >
          Soltar aqui
        </button>
      )}
    </div>
  )
}

function Ficha({
  dim,
  rotulo,
  pego,
  aoPegar,
  aoTirar,
  children,
}: {
  dim: string
  rotulo: string
  pego: boolean
  aoPegar: () => void
  aoTirar?: () => void
  children?: React.ReactNode
}) {
  return (
    <span
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', dim)}
      className={`flex cursor-grab items-center gap-1.5 rounded-lg border px-2 py-1 text-xs active:cursor-grabbing ${
        pego ? 'border-fg bg-fg text-bg' : 'border-border bg-surface'
      }`}
    >
      <button type="button" onClick={aoPegar} className="font-medium">
        {rotulo}
      </button>
      {children}
      {aoTirar && (
        <button
          type="button"
          onClick={aoTirar}
          aria-label={`Tirar ${rotulo}`}
          className={pego ? 'opacity-70' : 'text-muted hover:text-fg'}
        >
          ×
        </button>
      )}
    </span>
  )
}
