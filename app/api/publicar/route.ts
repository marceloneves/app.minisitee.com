import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { assinatura, gerarNestaMaquina } from '@/lib/html-estatico'

export const dynamic = 'force-dynamic'

// Quem salva no localhost usa o banco de producao, mas o HTML do minisite mora
// na VPS: o app local chama esta rota para a producao regerar o arquivo. O
// pedido vem assinado com a chave de servico (lib/html-estatico.ts) e vale por
// 5 minutos.
const VALIDADE_MS = 5 * 60 * 1000

function resposta(status: number) {
  return new NextResponse(null, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: NextRequest) {
  let corpo: Record<string, unknown>
  try {
    corpo = await request.json()
  } catch {
    return resposta(400)
  }

  const { username, quando, assinatura: recebida } = corpo
  if (
    typeof username !== 'string' ||
    !/^[a-z0-9_-]+$/.test(username) ||
    typeof quando !== 'string' ||
    typeof recebida !== 'string'
  ) {
    return resposta(400)
  }
  if (Math.abs(Date.now() - Number(quando)) > VALIDADE_MS) return resposta(403)

  const esperada = assinatura(username, quando)
  if (
    !esperada ||
    esperada.length !== recebida.length ||
    !timingSafeEqual(Buffer.from(esperada), Buffer.from(recebida))
  ) {
    return resposta(403)
  }

  // So a maquina com HTML_DIR (a VPS) gera. Aqui nunca se pede para outra
  // maquina: um app local chamando a si mesmo nao entra em laco.
  if (!process.env.HTML_DIR) return resposta(204)

  gerarNestaMaquina(username)
  return resposta(202)
}
