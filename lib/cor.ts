import type { CSSProperties } from 'react'

// Cor escolhida pelo dono para um bloco do minisite. So aceita #rrggbb: o
// valor vai direto para o style da pagina publica.
export function corHexValida(valor: unknown) {
  return typeof valor === 'string' && /^#[0-9a-f]{6}$/i.test(valor) ? valor.toLowerCase() : null
}

// Luminancia relativa da WCAG.
function luminancia(hex: string) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function fundoEscuro(hex: string) {
  const l = luminancia(hex)
  // Texto branco se ele contrasta mais com o fundo do que o preto.
  return 1.05 / (l + 0.05) > (l + 0.05) / 0.05
}

// Pinta o bloco e redefine as variaveis do tema dentro dele: rotulos, linhas
// e campos do formulario seguem o contraste da cor escolhida sem precisar
// mexer em componente nenhum. O `color` vai junto porque o texto herda a cor
// ja calculada do pai, e trocar so a variavel nao a alcancaria.
export function estiloDeFundo(hex: string): CSSProperties {
  const escuro = fundoEscuro(hex)
  return {
    background: hex,
    color: escuro ? '#fafafa' : '#18181b',
    '--surface': hex,
    '--fg': escuro ? '#fafafa' : '#18181b',
    '--muted': escuro ? 'rgba(255, 255, 255, 0.72)' : 'rgba(24, 24, 27, 0.66)',
    '--border': escuro ? 'rgba(255, 255, 255, 0.24)' : 'rgba(24, 24, 27, 0.14)',
  } as CSSProperties
}
