import qrcode from 'qrcode-generator'

// So vira QR um endereco completo: o rascunho nasce com "https://" e um QR
// disso levaria o visitante a lugar nenhum.
export function urlDoQrCode(url: string | null | undefined) {
  const limpa = url?.trim() ?? ''
  return /^https?:\/\/[^/\s]+\.[^\s]+$/.test(limpa) ? limpa : null
}

// O QR sai como um unico <path> SVG montado no servidor: vai pronto no HTML
// estatico, sem JavaScript no navegador, e fica nitido em qualquer tamanho.
// Preto no branco em todo estilo, porque leitor de QR nao lida bem com cor
// invertida nem com pouco contraste.
export function QrCode({ valor, className }: { valor: string; className?: string }) {
  // A lib grava cada caractere como um byte so, o que estraga acento. O href
  // do URL ja vem todo em ASCII: caminho com %, dominio em punycode.
  let dados = valor
  try {
    dados = new URL(valor).href
  } catch {}

  let qr
  try {
    qr = qrcode(0, 'M')
    qr.addData(dados)
    qr.make()
  } catch {
    // Texto longo demais para caber em um QR.
    return null
  }

  const modulos = qr.getModuleCount()
  // Zona de silencio de 4 modulos em volta: sem ela muito leitor nao acha o QR.
  const margem = 4
  const lado = modulos + margem * 2

  let d = ''
  for (let linha = 0; linha < modulos; linha++) {
    for (let coluna = 0; coluna < modulos; coluna++) {
      if (qr.isDark(linha, coluna)) d += `M${coluna + margem} ${linha + margem}h1v1h-1z`
    }
  }

  return (
    <svg
      viewBox={`0 0 ${lado} ${lado}`}
      role="img"
      aria-label={`QR code: ${valor}`}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={lado} height={lado} fill="#ffffff" />
      <path d={d} fill="#000000" />
    </svg>
  )
}
