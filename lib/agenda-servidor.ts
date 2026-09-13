import 'server-only'
import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { agoraNoFuso, configAgenda, horariosLivres } from '@/lib/agenda'
import { createAdminClient } from '@/lib/supabase/admin'
import type { DadosItem } from '@/lib/types'

export type Admin = ReturnType<typeof createAdminClient>
export type AgendaServidor = { id: string; profile_id: string; data: DadosItem | null }

// Horario livre e agendamento mudam a cada pedido: nada aqui pode ser cacheado.
export function resposta(corpo: object, status = 200) {
  return NextResponse.json(corpo, { status, headers: { 'Cache-Control': 'no-store' } })
}

// O visitante nao tem sessao, entao a leitura e com a chave de servico. Por
// isso as rotas conferem tudo sozinhas: so agenda publicada recebe pedido.
export async function carregarAgenda(admin: Admin, itemId: string): Promise<AgendaServidor | null> {
  if (!/^[0-9a-f-]{36}$/i.test(itemId)) return null

  const { data } = await admin
    .from('items')
    .select('id, profile_id, kind, status, data')
    .eq('id', itemId)
    .maybeSingle()

  if (!data || data.kind !== 'agenda' || !['ativo', 'reservado'].includes(data.status)) {
    return null
  }
  return data
}

// `ignorarId` e o agendamento sendo remarcado: o horario atual dele nao pode
// contar como ocupado para ele mesmo.
export async function livresNoDia(
  admin: Admin,
  agenda: AgendaServidor,
  dia: string,
  ignorarId?: string
) {
  let consulta = admin
    .from('agendamentos')
    .select('hora')
    .eq('item_id', agenda.id)
    .eq('dia', dia)
    .neq('status', 'cancelado')
  if (ignorarId) consulta = consulta.neq('id', ignorarId)

  const { data, error } = await consulta
  if (error) throw error
  // O Postgres devolve time como HH:MM:SS.
  const ocupados = (data ?? []).map((a) => String(a.hora).slice(0, 5))
  return horariosLivres(configAgenda(agenda.data), dia, ocupados, agoraNoFuso())
}

export function normalizarEmail(valor: unknown) {
  if (typeof valor !== 'string') return null
  const email = valor.trim().toLowerCase()
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

export function gerarCodigo() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export function hashCodigo(itemId: string, email: string, codigo: string) {
  return createHash('sha256').update(`${itemId}:${email}:${codigo}`).digest('hex')
}

export function mesmoHash(a: string, b: string) {
  const x = Buffer.from(a, 'hex')
  const y = Buffer.from(b, 'hex')
  return x.length === y.length && timingSafeEqual(x, y)
}

// O acesso a "Meus agendamentos" e um token assinado com HMAC: agenda, e-mail
// e validade. Nao precisa de tabela, e ninguem forja um sem o segredo.
const VALIDADE_ACESSO_MS = 30 * 24 * 60 * 60 * 1000

function segredo() {
  const base = process.env.AGENDA_SEGREDO || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base) throw new Error('sem segredo para assinar o acesso da agenda')
  return createHmac('sha256', base).update('agenda-acesso-v1').digest()
}

export function assinarAcesso(itemId: string, email: string) {
  const corpo = Buffer.from(
    JSON.stringify({ i: itemId, e: email, x: Date.now() + VALIDADE_ACESSO_MS })
  ).toString('base64url')
  const assinatura = createHmac('sha256', segredo()).update(corpo).digest('base64url')
  return `${corpo}.${assinatura}`
}

// Devolve o e-mail do acesso, ou null se o token nao vale para esta agenda.
export function lerAcesso(request: NextRequest, itemId: string) {
  const cabecalho = request.headers.get('authorization')
  const token = cabecalho?.startsWith('Bearer ') ? cabecalho.slice(7) : null
  if (!token) return null

  const [corpo, assinatura] = token.split('.')
  if (!corpo || !assinatura) return null

  const esperada = createHmac('sha256', segredo()).update(corpo).digest()
  const recebida = Buffer.from(assinatura, 'base64url')
  if (recebida.length !== esperada.length || !timingSafeEqual(recebida, esperada)) return null

  try {
    const dados = JSON.parse(Buffer.from(corpo, 'base64url').toString('utf8'))
    if (dados.i !== itemId || typeof dados.e !== 'string' || typeof dados.x !== 'number') return null
    return dados.x > Date.now() ? (dados.e as string) : null
  } catch {
    return null
  }
}
