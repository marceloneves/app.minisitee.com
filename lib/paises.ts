export const PAISES = [
  ['BR', '55', 'Brasil'],
  ['PT', '351', 'Portugal'],
  ['US', '1', 'Estados Unidos / Canadá'],
  ['ES', '34', 'España'],
  ['MX', '52', 'México'],
  ['AR', '54', 'Argentina'],
  ['CL', '56', 'Chile'],
  ['CO', '57', 'Colombia'],
  ['PE', '51', 'Perú'],
  ['UY', '598', 'Uruguay'],
  ['PY', '595', 'Paraguay'],
  ['BO', '591', 'Bolivia'],
  ['EC', '593', 'Ecuador'],
  ['VE', '58', 'Venezuela'],
  ['CR', '506', 'Costa Rica'],
  ['PA', '507', 'Panamá'],
  ['DO', '1809', 'República Dominicana'],
  ['GB', '44', 'United Kingdom'],
  ['FR', '33', 'France'],
  ['DE', '49', 'Deutschland'],
  ['IT', '39', 'Italia'],
  ['AO', '244', 'Angola'],
  ['MZ', '258', 'Moçambique'],
] as const

const DIALS = [...new Set(PAISES.map(([, dial]) => dial))].sort(
  (a, b) => b.length - a.length
)

export function separarTelefone(digitos: string | null | undefined) {
  const d = (digitos ?? '').replace(/\D/g, '')
  if (!d) return { dial: '55', nacional: '' }

  const encontrado = DIALS.find((dial) => d.startsWith(dial))
  if (encontrado) return { dial: encontrado, nacional: d.slice(encontrado.length) }

  // Código fora da lista: assume os 2 primeiros dígitos como país.
  return d.length > 2
    ? { dial: d.slice(0, 2), nacional: d.slice(2) }
    : { dial: d, nacional: '' }
}

export function juntarTelefone(dial: string, nacional: string) {
  const n = nacional.replace(/\D/g, '')
  const completo = `${dial}${n}`
  return completo.length >= 10 && completo.length <= 15 ? completo : null
}

export function formatarNacional(dial: string, nacional: string) {
  const d = nacional.replace(/\D/g, '')
  if (dial !== '55') return d

  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function telefoneExibicao(digitos: string | null | undefined) {
  const { dial, nacional } = separarTelefone(digitos)
  return `+${dial} ${formatarNacional(dial, nacional)}`.trim()
}
