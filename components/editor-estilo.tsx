'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition, type ReactNode } from 'react'
import { atualizarEstilo } from '@/lib/actions/profile'
import { useIdioma, useT } from '@/lib/i18n/contexto'
import type { Dicionario } from '@/lib/i18n/dicionarios'
import {
  FONTES,
  PRONTOS,
  atributosDoMinisite,
  estiloDoPronto,
  type EstiloPersonalizado,
  type Formato,
  type Preenchimento,
  type Sombra,
} from '@/lib/estilo'

const OPCOES_FORMATO: [Formato, keyof Dicionario][] = [
  ['reto', 'estReto'],
  ['arredondado', 'estArredondado'],
  ['pilula', 'estPilula'],
]

const OPCOES_PREENCHIMENTO: [Preenchimento, keyof Dicionario][] = [
  ['cheio', 'estCheio'],
  ['contorno', 'estContorno'],
]

const OPCOES_SOMBRA: [Sombra, keyof Dicionario][] = [
  ['nenhuma', 'estSemSombra'],
  ['leve', 'estSombraLeve'],
  ['forte', 'estSombraForte'],
]

export function EditorEstilo({
  inicial,
  estiloInicial,
  previa,
}: {
  inicial: string
  // Nulo quando o dono nunca personalizou: os ajustes partem do estilo pronto.
  estiloInicial: EstiloPersonalizado | null
  previa?: ReactNode
}) {
  const t = useT()
  const idioma = useIdioma()
  const router = useRouter()
  const [tema, setTema] = useState(inicial)
  const [estilo, setEstilo] = useState<EstiloPersonalizado>(
    () => estiloInicial ?? estiloDoPronto(inicial)
  )
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, iniciar] = useTransition()

  const [salvo] = useState(() => JSON.stringify({ tema: inicial, estilo }))
  const mudou = JSON.stringify({ tema, estilo }) !== salvo

  function ajustar<K extends keyof EstiloPersonalizado>(campo: K, valor: EstiloPersonalizado[K]) {
    // Mexeu em qualquer ajuste, deixou de ser o tema pronto.
    setEstilo((e) => ({ ...e, [campo]: valor, pronto: undefined }))
  }

  // Tema pronto e ponto de partida: preenche todos os ajustes de uma vez.
  function escolherPronto(p: (typeof PRONTOS)[number]) {
    setTema(p.base)
    setEstilo({ ...p.estilo })
  }

  function salvar() {
    setErro(null)
    iniciar(async () => {
      const r = await atualizarEstilo(tema, estilo)
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
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">{t('estPronto')}</h2>
        {!estilo.pronto && <span className="text-xs text-muted">{t('estPersonalizado')}</span>}
      </div>
      <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {PRONTOS.map((p) => (
          <li key={p.valor}>
            <button
              type="button"
              onClick={() => escolherPronto(p)}
              aria-pressed={estilo.pronto === p.valor}
              className={`w-full overflow-hidden rounded-xl border-2 text-left transition-colors ${
                estilo.pronto === p.valor ? 'border-fg' : 'border-border hover:border-muted'
              }`}
            >
              <MiniaturaPronto estilo={p.estilo} />
              <span className="block px-2 py-1.5 text-sm font-medium">{p.rotulo[idioma]}</span>
            </button>
          </li>
        ))}
      </ul>

      <Grupo titulo={t('estPagina')}>
        <div className="grid grid-cols-2 gap-3">
          <Cor rotulo={t('estFundo')} valor={estilo.fundo} aoMudar={(v) => ajustar('fundo', v)} />
          <Cor rotulo={t('estTexto')} valor={estilo.texto} aoMudar={(v) => ajustar('texto', v)} />
        </div>
      </Grupo>

      <Grupo titulo={t('estBotoes')}>
        <div className="grid grid-cols-2 gap-3">
          <Cor rotulo={t('estCor')} valor={estilo.cartao} aoMudar={(v) => ajustar('cartao', v)} />
          <Cor
            rotulo={t('estTexto')}
            valor={estilo.textoCartao}
            aoMudar={(v) => ajustar('textoCartao', v)}
          />
        </div>
        <Opcoes
          rotulo={t('estCantos')}
          opcoes={OPCOES_FORMATO.map(([v, k]) => [v, t(k)])}
          valor={estilo.formato}
          aoMudar={(v) => ajustar('formato', v)}
        />
        <Opcoes
          rotulo={t('estPreenchimento')}
          opcoes={OPCOES_PREENCHIMENTO.map(([v, k]) => [v, t(k)])}
          valor={estilo.preenchimento}
          aoMudar={(v) => ajustar('preenchimento', v)}
        />
        <Opcoes
          rotulo={t('estSombra')}
          opcoes={OPCOES_SOMBRA.map(([v, k]) => [v, t(k)])}
          valor={estilo.sombra}
          aoMudar={(v) => ajustar('sombra', v)}
        />
      </Grupo>

      <Grupo titulo={t('estFonte')}>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FONTES.map((f) => (
            <li key={f.valor}>
              <button
                type="button"
                onClick={() => ajustar('fonte', f.valor)}
                aria-pressed={estilo.fonte === f.valor}
                style={f.variavel ? { fontFamily: `var(${f.variavel}), sans-serif` } : undefined}
                className={`w-full rounded-xl border-2 px-3 py-2.5 text-base transition-colors ${
                  estilo.fonte === f.valor ? 'border-fg' : 'border-border hover:border-muted'
                }`}
              >
                {f.rotulo}
              </button>
            </li>
          ))}
        </ul>
      </Grupo>

      {erro && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={salvar}
        disabled={salvando || !mudou}
        className="mt-6 w-full rounded-xl bg-brand px-4 py-3 text-base font-medium text-brand-fg disabled:opacity-50"
      >
        {salvando ? t('salvando') : t('salvar')}
      </button>

      {previa && (
        <>
          <h2 className="mt-8 text-sm font-semibold">{t('estPrevia')}</h2>
          <div
            {...atributosDoMinisite(tema, estilo)}
            className="mt-3 overflow-hidden rounded-2xl border border-border bg-bg text-fg"
          >
            {previa}
          </div>
        </>
      )}
    </div>
  )
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-sm font-semibold">{titulo}</h2>
      {children}
    </section>
  )
}

function Cor({
  rotulo,
  valor,
  aoMudar,
}: {
  rotulo: string
  valor: string
  aoMudar: (v: string) => void
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
      <input
        type="color"
        value={valor}
        onChange={(e) => aoMudar(e.target.value.toLowerCase())}
        className="size-9 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{rotulo}</span>
        <span className="block text-xs uppercase text-muted">{valor}</span>
      </span>
    </label>
  )
}

function Opcoes<T extends string>({
  rotulo,
  opcoes,
  valor,
  aoMudar,
}: {
  rotulo: string
  opcoes: [T, string][]
  valor: T
  aoMudar: (v: T) => void
}) {
  return (
    <fieldset>
      <legend className="text-sm text-muted">{rotulo}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {opcoes.map(([v, texto]) => (
          <button
            key={v}
            type="button"
            onClick={() => aoMudar(v)}
            aria-pressed={valor === v}
            className={`rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors ${
              valor === v ? 'border-fg' : 'border-border hover:border-muted'
            }`}
          >
            {texto}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

// Amostra do tema como o Linktree mostra: o fundo, o "Aa" na fonte e na cor do
// texto e dois botoes no formato, na cor e no preenchimento do tema.
function MiniaturaPronto({ estilo }: { estilo: EstiloPersonalizado }) {
  const fonte = FONTES.find((f) => f.valor === estilo.fonte)
  const raio = estilo.formato === 'reto' ? '0' : estilo.formato === 'pilula' ? '9999px' : '0.3rem'
  const contorno = estilo.preenchimento === 'contorno'
  const botao = {
    height: '0.9rem',
    borderRadius: raio,
    background: contorno ? 'transparent' : estilo.cartao,
    border: `1.5px solid ${estilo.cartao}`,
    boxShadow: estilo.sombra === 'nenhuma' ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.2)',
  }
  return (
    <span
      className="flex h-28 flex-col items-center justify-center gap-1.5 px-3"
      style={{
        background: estilo.fundo,
        color: estilo.texto,
        fontFamily: fonte?.variavel ? `var(${fonte.variavel}), sans-serif` : undefined,
      }}
    >
      <span className="text-lg font-semibold leading-none">Aa</span>
      <span className="block w-full" style={botao} />
      <span className="block w-full" style={botao} />
    </span>
  )
}
