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

const LADO_AVATAR = 512

// A foto de perfil aparece sempre num circulo: corta o centro em quadrado
// antes de enviar, para nao depender de object-fit em cada lugar que usa.
export async function prepararAvatar(arquivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo)
  const lado = Math.min(bitmap.width, bitmap.height)
  const origemX = (bitmap.width - lado) / 2
  const origemY = (bitmap.height - lado) / 2
  const destino = Math.min(lado, LADO_AVATAR)

  const canvas = document.createElement('canvas')
  canvas.width = destino
  canvas.height = destino

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Canvas indisponível')
  }

  ctx.drawImage(bitmap, origemX, origemY, lado, lado, 0, 0, destino, destino)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', QUALIDADE)
  )
  if (!blob) throw new Error('Falha ao converter a imagem')
  return blob
}
