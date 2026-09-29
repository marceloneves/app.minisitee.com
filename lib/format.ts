const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const area = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
})

export function formatBRL(cents: number) {
  return brl.format(cents / 100)
}

export function formatArea(m2: number) {
  return `${area.format(m2)} m²`
}

// O preco do produto e um campo so, de texto livre ("R$ 25,00", "a partir de
// R$ 90", "R$ 40 por hora", "Gratis"). No banco continuam as duas colunas:
// price_note guarda o texto e price_cents o primeiro valor dele, que o
// schema.org e o cubo usam.
//
// Antes eram dois campos, valor e complemento ("por hora"). Complemento sem
// numero ao lado de um valor e dado desse formato antigo: os dois aparecem
// juntos, sem precisar migrar nada.
export function textoDoPreco(cents: number | null | undefined, nota: string | null | undefined) {
  const n = nota?.trim() ?? ''
  if (n && /\d/.test(n)) return n
  if (cents && cents > 0) return n ? `${formatBRL(cents)} ${n}` : formatBRL(cents)
  return n
}

// Primeiro valor do texto em centavos: "a partir de R$ 1.250,90" -> 125090.
function centavosDoTexto(texto: string) {
  const m = texto.match(/\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?/)
  if (!m) return null
  const valor = Number(m[0].replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(valor) && valor > 0 ? Math.round(valor * 100) : null
}

// O que o editor grava. So o numero ("25", "R$ 25,50") vira preco formatado,
// sem texto; qualquer outra coisa fica como a pessoa escreveu.
export function precoDoTexto(texto: string) {
  const t = texto.trim()
  if (!t) return { price_cents: null, price_note: null }
  const cents = centavosDoTexto(t)
  if (cents !== null && /^(R\$\s*)?[\d.]+(,\d{1,2})?$/i.test(t)) {
    return { price_cents: cents, price_note: null }
  }
  return { price_cents: cents, price_note: t }
}
