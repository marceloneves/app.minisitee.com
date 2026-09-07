export function maskCurrency(input: string) {
  const digits = input.replace(/\D/g, '').slice(0, 12)
  if (!digits) return ''
  const cents = Number(digits)
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function currencyToCents(input: string) {
  const digits = input.replace(/\D/g, '')
  return digits ? Number(digits) : null
}

export function centsToCurrency(cents: number | null | undefined) {
  if (cents === null || cents === undefined) return ''
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

