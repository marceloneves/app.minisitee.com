export function maskCurrency(input: string) {
  const digits = input.replace(/\D/g, '').slice(0, 12)
  const cents = Number(digits)
  // Apagar com backspace para em "0,00": sem isso o campo nunca fica vazio e o
  // preco grava 0 em vez de "Sob consulta".
  if (!cents) return ''
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function currencyToCents(input: string) {
  const cents = Number(input.replace(/\D/g, ''))
  return cents || null
}

export function centsToCurrency(cents: number | null | undefined) {
  if (!cents) return ''
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

