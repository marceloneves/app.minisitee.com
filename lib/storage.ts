const MARCADOR = '/storage/v1/object/public/media/'

export function caminhoDaUrl(url: string) {
  const i = url.indexOf(MARCADOR)
  return i === -1 ? null : decodeURIComponent(url.slice(i + MARCADOR.length))
}
