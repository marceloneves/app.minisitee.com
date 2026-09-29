'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AvisoSalvamento, type Situacao } from '@/components/aviso-salvamento'
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
  const [tema, setTema] = useState(inicial)
  const [estilo, setEstilo] = useState<EstiloPersonalizado>(
    () => estiloInicial ?? estiloDoPronto(inicial)
  )
  // Os ajustes ficam fechados atras do botao Personalizar; abrem sozinhos
  // quando o que esta salvo ja e personalizado.
  const [personalizando, setPersonalizando] = useState(() => !estilo.pronto)
  const [situacao, setSituacao] = useState<Situacao>('parado')
  const [erro, setErro] = useState<string | null>(null)

  // Salva sozinho, sem botao: cada tema ou ajuste vai para o banco um pouco
  // depois da ultima mudanca. A espera junta o arrastar do seletor de cor, que
  // muda o valor dezenas de vezes, num salvamento so. Resposta de um pedido
  // antigo que chega depois de um novo e ignorada.
  const ultimoSalvo = useRef(JSON.stringify({ tema: inicial, estilo }))
  const pedido = useRef(0)

  useEffect(() => {
    const atual = JSON.stringify({ tema, estilo })
    if (atual === ultimoSalvo.current) return
    const espera = setTimeout(async () => {
      const id = ++pedido.current
      setSituacao('salvando')
      const r = await atualizarEstilo(tema, estilo)
      if (id !== pedido.current) return
      if ('erro' in r && r.erro) {
        setErro(r.erro)
        setSituacao('erro')
        return
      }
      ultimoSalvo.current = atual
      setErro(null)
      setSituacao('salvo')
      // "Salvo" some depois de um tempo; o erro fica ate a proxima tentativa.
      setTimeout(() => {
        if (id === pedido.current) setSituacao('parado')
      }, 2000)
    }, 800)
    return () => clearTimeout(espera)
  }, [tema, estilo])

  function ajustar<K extends keyof EstiloPersonalizado>(campo: K, valor: EstiloPersonalizado[K]) {
    // Mexeu em qualquer ajuste, deixou de ser o tema pronto.
    setEstilo((e) => ({ ...e, [campo]: valor, pronto: undefined }))
  }

  // Tema pronto e ponto de partida: preenche todos os ajustes de uma vez.
  function escolherPronto(p: (typeof PRONTOS)[number]) {
    setTema(p.base)
    setEstilo({ ...p.estilo })
  }

  return (
    <div>
      <p className="mb-4 text-xs text-muted">{t('estSalvaSozinho')}</p>

      <AvisoSalvamento situacao={situacao} mensagem={erro} />

      <h2 className="text-sm font-semibold">{t('estPronto')}</h2>
      <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {/* Como no Linktree: o Personalizar e o primeiro quadrado da grade.
            Fica marcado quando os ajustes estao abertos ou o estilo ja nao e
            nenhum dos temas prontos. */}
        <li>
          <button
            type="button"
            onClick={() => setPersonalizando((v) => !v)}
            aria-expanded={personalizando}
            aria-controls="ajustes-estilo"
            className={`w-full overflow-hidden rounded-xl border-2 text-left transition-colors ${
              personalizando || !estilo.pronto ? 'border-fg' : 'border-border hover:border-muted'
            }`}
          >
            <span className="flex h-28 items-center justify-center bg-surface text-muted">
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="size-8"
              >
                <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
                <circle cx="16" cy="7" r="2" />
                <circle cx="10" cy="17" r="2" />
              </svg>
            </span>
            <span className="block px-2 py-1.5 text-sm font-medium">{t('estPersonalizar')}</span>
          </button>
        </li>
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

      {personalizando && (
        <div id="ajustes-estilo">
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
        </div>
      )}

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
