const LADO_MAXIMO = 1600
const QUALIDADE = 0.82

export async function prepararFoto(arquivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo)
  const maior = Math.max(bitmap.width, bitmap.height)
  const escala = maior > LADO_MAXIMO ? LADO_MAXIMO / maior : 1

  const largura = Math.round(bitmap.width * escala)
  const altura = Math.round(bitmap.height * escala)

  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Canvas indisponível')
  }

  ctx.drawImage(bitmap, 0, 0, largura, altura)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', QUALIDADE)
  )
  if (!blob) throw new Error('Falha ao converter a imagem')
  return blob
}
