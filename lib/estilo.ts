import type { CSSProperties } from 'react'
import { corHexValida } from '@/lib/cor'

// Ajustes do dono por cima do estilo pronto: fica em profiles.estilo (jsonb).
// Nulo quer dizer que ele nunca personalizou, e vale so o estilo pronto.
export type EstiloPersonalizado = {
  fundo: string
  texto: string
  cartao: string
  textoCartao: string
  formato: Formato
  preenchimento: Preenchimento
  sombra: Sombra
  fonte: Fonte
  // Tema pronto de onde os ajustes vieram, enquanto ninguem mexeu neles; so
  // serve para o painel marcar o tema escolhido.
  pronto?: string
}

export const FORMATOS = ['reto', 'arredondado', 'pilula'] as const
export const PREENCHIMENTOS = ['cheio', 'contorno'] as const
export const SOMBRAS = ['nenhuma', 'leve', 'forte'] as const

export type Formato = (typeof FORMATOS)[number]
export type Preenchimento = (typeof PREENCHIMENTOS)[number]
export type Sombra = (typeof SOMBRAS)[number]

// `variavel` e a do next/font em lib/fontes.ts; a padrao e a fonte do sistema,
// a mesma do minisite de sempre.
export const FONTES = [
  { valor: 'padrao', rotulo: 'Padrão', variavel: '' },
  { valor: 'capriola', rotulo: 'Capriola', variavel: '--fonte-capriola' },
  { valor: 'poppins', rotulo: 'Poppins', variavel: '--fonte-poppins' },
  { valor: 'montserrat', rotulo: 'Montserrat', variavel: '--fonte-montserrat' },
  { valor: 'playfair', rotulo: 'Playfair Display', variavel: '--fonte-playfair' },
  { valor: 'lora', rotulo: 'Lora', variavel: '--fonte-lora' },
] as const

export type Fonte = (typeof FONTES)[number]['valor']

type Rotulo = { pt: string; en: string; es: string }

function pronto(
  valor: string,
  rotulo: Rotulo,
  base: string,
  fundo: string,
  texto: string,
  cartao: string,
  textoCartao: string,
  formato: Formato,
  preenchimento: Preenchimento,
  sombra: Sombra,
  fonte: Fonte
) {
  return {
    valor,
    rotulo,
    // O theme gravado no banco. O check theme_valido so conhece os cinco
    // estilos de cor; os temas novos gravam o mais proximo deles, e o que vale
    // na tela e o estilo personalizado.
    base,
    estilo: { fundo, texto, cartao, textoCartao, formato, preenchimento, sombra, fonte, pronto: valor },
  }
}

// Temas prontos, no espirito da galeria do Linktree: cada um traz fundo,
// botoes, cantos, sombra e fonte. Escolher um preenche todos os ajustes; mexer
// em qualquer ajuste depois vira "personalizado".
export const PRONTOS = [
  pronto('light', { pt: 'Claro', en: 'Light', es: 'Claro' }, 'light', '#ffffff', '#18181b', '#f7f7f8', '#18181b', 'arredondado', 'cheio', 'nenhuma', 'padrao'),
  pronto('areia', { pt: 'Areia', en: 'Sand', es: 'Arena' }, 'areia', '#ffffff', '#2b1a08', '#fff3e2', '#2b1a08', 'arredondado', 'cheio', 'nenhuma', 'padrao'),
  pronto('menta', { pt: 'Menta', en: 'Mint', es: 'Menta' }, 'menta', '#ffffff', '#0d2b21', '#e7f7f0', '#0d2b21', 'arredondado', 'cheio', 'nenhuma', 'padrao'),
  pronto('oceano', { pt: 'Oceano', en: 'Ocean', es: 'Océano' }, 'oceano', '#ffffff', '#0b1f38', '#e6f0fd', '#0b1f38', 'arredondado', 'cheio', 'nenhuma', 'padrao'),
  pronto('rosa', { pt: 'Rosa', en: 'Rose', es: 'Rosa' }, 'rosa', '#ffffff', '#2e0d1b', '#fdeaf1', '#2e0d1b', 'arredondado', 'cheio', 'nenhuma', 'padrao'),
  pronto('nude', { pt: 'Nude', en: 'Nude', es: 'Nude' }, 'areia', '#c7bfbc', '#1e2330', '#ffffff', '#000000', 'reto', 'cheio', 'leve', 'capriola'),
  pronto('minimal', { pt: 'Minimal', en: 'Minimal', es: 'Minimal' }, 'light', '#ffffff', '#000000', '#000000', '#000000', 'reto', 'contorno', 'nenhuma', 'montserrat'),
  pronto('papel', { pt: 'Papel', en: 'Paper', es: 'Papel' }, 'areia', '#f5f0e6', '#3b2f2f', '#3b2f2f', '#3b2f2f', 'reto', 'contorno', 'nenhuma', 'playfair'),
  pronto('ceu', { pt: 'Céu', en: 'Sky', es: 'Cielo' }, 'oceano', '#bae6fd', '#0c4a6e', '#ffffff', '#0c4a6e', 'arredondado', 'cheio', 'leve', 'capriola'),
  pronto('lavanda', { pt: 'Lavanda', en: 'Lavender', es: 'Lavanda' }, 'rosa', '#ede9fe', '#3b0764', '#7c3aed', '#ffffff', 'pilula', 'cheio', 'leve', 'poppins'),
  pronto('chiclete', { pt: 'Chiclete', en: 'Bubblegum', es: 'Chicle' }, 'rosa', '#fbcfe8', '#831843', '#ec4899', '#ffffff', 'pilula', 'cheio', 'forte', 'poppins'),
  pronto('coral', { pt: 'Coral', en: 'Coral', es: 'Coral' }, 'rosa', '#ff7f6e', '#ffffff', '#ffffff', '#7f1d1d', 'pilula', 'cheio', 'leve', 'poppins'),
  pronto('limao', { pt: 'Limão', en: 'Lemon', es: 'Limón' }, 'areia', '#fef9c3', '#1c1917', '#1c1917', '#fef9c3', 'reto', 'cheio', 'forte', 'montserrat'),
  pronto('floresta', { pt: 'Floresta', en: 'Forest', es: 'Bosque' }, 'menta', '#14532d', '#ecfdf5', '#ecfdf5', '#14532d', 'arredondado', 'cheio', 'nenhuma', 'lora'),
  pronto('terra', { pt: 'Terra', en: 'Clay', es: 'Tierra' }, 'areia', '#7c2d12', '#fed7aa', '#fed7aa', '#7c2d12', 'reto', 'cheio', 'nenhuma', 'lora'),
  pronto('vinho', { pt: 'Vinho', en: 'Wine', es: 'Vino' }, 'rosa', '#4c0519', '#fff1f2', '#fff1f2', '#fff1f2', 'pilula', 'contorno', 'nenhuma', 'playfair'),
  pronto('noite', { pt: 'Noite', en: 'Night', es: 'Noche' }, 'oceano', '#0f172a', '#f8fafc', '#1e293b', '#f8fafc', 'arredondado', 'cheio', 'nenhuma', 'poppins'),
  pronto('grafite', { pt: 'Grafite', en: 'Graphite', es: 'Grafito' }, 'light', '#18181b', '#fafafa', '#fafafa', '#18181b', 'pilula', 'cheio', 'nenhuma', 'montserrat'),
] satisfies {
  valor: string
  rotulo: Rotulo
  base: string
  estilo: EstiloPersonalizado
}[]

// Quem nunca personalizou comeca pelo tema pronto do seu theme.
export function estiloDoPronto(tema: string): EstiloPersonalizado {
  return { ...(PRONTOS.find((p) => p.valor === tema) ?? PRONTOS[0]).estilo }
}

function umDe<T extends string>(lista: readonly T[], valor: unknown, padrao: T): T {
  return lista.includes(valor as T) ? (valor as T) : padrao
}

// O valor vem do banco ou do navegador e vai para o style da pagina publica:
// so passa cor #rrggbb e opcao conhecida.
export function estiloValido(valor: unknown): EstiloPersonalizado | null {
  if (!valor || typeof valor !== 'object') return null
  const v = valor as Record<string, unknown>
  const fundo = corHexValida(v.fundo)
  const texto = corHexValida(v.texto)
  const cartao = corHexValida(v.cartao)
  const textoCartao = corHexValida(v.textoCartao)
  if (!fundo || !texto || !cartao || !textoCartao) return null
  return {
    fundo,
    texto,
    cartao,
    textoCartao,
    formato: umDe(FORMATOS, v.formato, 'arredondado'),
    preenchimento: umDe(PREENCHIMENTOS, v.preenchimento, 'cheio'),
    sombra: umDe(SOMBRAS, v.sombra, 'nenhuma'),
    fonte: umDe(
      FONTES.map((f) => f.valor),
      v.fonte,
      'padrao'
    ),
    ...(PRONTOS.some((p) => p.valor === v.pronto) ? { pronto: v.pronto as string } : {}),
  }
}

const RAIO: Record<Formato, { botao: string; caixa: string }> = {
  reto: { botao: '0', caixa: '0' },
  arredondado: { botao: '1rem', caixa: '1rem' },
  // Pilula inteira so cabe no botao de uma linha; num cartao de produto com
  // foto o raio de 9999px cortaria a imagem, entao a caixa fica bem redonda.
  pilula: { botao: '9999px', caixa: '1.75rem' },
}

const SOMBRA: Record<Sombra, string> = {
  nenhuma: 'none',
  leve: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
  forte: '0 8px 20px rgba(0, 0, 0, 0.18)',
}

// Vira variaveis CSS no container do minisite; o globals.css le essas
// variaveis em [data-personalizado] e na classe .cartao.
export function varsDoEstilo(e: EstiloPersonalizado): CSSProperties {
  const contorno = e.preenchimento === 'contorno'
  const fonte = FONTES.find((f) => f.valor === e.fonte)
  return {
    '--bg': e.fundo,
    '--fg': e.texto,
    '--muted': `color-mix(in srgb, ${e.texto} 68%, ${e.fundo})`,
    '--border': `color-mix(in srgb, ${e.texto} 15%, ${e.fundo})`,
    '--surface': e.cartao,
    // Botoes de enviar da Agenda e do Formulario ficam dentro do cartao: na
    // cor do texto dele, com o texto na cor do cartao, o contraste e garantido.
    '--brand': e.textoCartao,
    '--brand-fg': contorno ? e.fundo : e.cartao,
    '--cartao-bg': contorno ? 'transparent' : e.cartao,
    '--cartao-fg': e.textoCartao,
    '--cartao-muted': `color-mix(in srgb, ${e.textoCartao} 68%, ${contorno ? e.fundo : e.cartao})`,
    '--cartao-borda': contorno
      ? e.cartao
      : `color-mix(in srgb, ${e.textoCartao} 10%, ${e.cartao})`,
    '--cartao-borda-largura': contorno ? '2px' : '1px',
    '--raio-botao': RAIO[e.formato].botao,
    '--raio-caixa': RAIO[e.formato].caixa,
    '--sombra': SOMBRA[e.sombra],
    ...(fonte?.variavel ? { fontFamily: `var(${fonte.variavel}), sans-serif` } : {}),
  } as CSSProperties
}

// Atributos do container do minisite: pagina publica, Visualizar e previa do
// painel. Sem ajustes validos fica so o data-tema do estilo pronto.
export function atributosDoMinisite(tema: string, estilo: EstiloPersonalizado | null) {
  return {
    'data-tema': tema,
    ...(estilo ? { 'data-personalizado': '', style: varsDoEstilo(estilo) } : {}),
  }
}
