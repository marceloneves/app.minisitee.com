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
