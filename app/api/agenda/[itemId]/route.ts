import type { NextRequest } from 'next/server'
import { agoraNoFuso, ehDia, ehHora } from '@/lib/agenda'
import {
  carregarAgenda,
  livresNoDia,
  normalizarEmail,
  resposta,
} from '@/lib/agenda-servidor'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Pedidos em aberto que o mesmo telefone pode ter na mesma agenda. Segura quem
// tentaria ocupar a agenda inteira de uma vez.
const MAX_PENDENTES_POR_TELEFONE = 3

type Contexto = { params: Promise<{ itemId: string }> }

export async function GET(request: NextRequest, { params }: Contexto) {
  const { itemId } = await params
  const dia = request.nextUrl.searchParams.get('dia')
  if (!ehDia(dia)) return resposta({ erro: 'dia inválido' }, 400)

  const admin = createAdminClient()
  const agenda = await carregarAgenda(admin, itemId)
  if (!agenda) return resposta({ erro: 'agenda não encontrada' }, 404)

  try {
    return resposta({ horarios: await livresNoDia(admin, agenda, dia) })
  } catch (e) {
    console.error('[agenda] falha ao listar horarios', itemId, (e as Error).message)
    return resposta({ erro: 'falha' }, 500)
  }
}

export async function POST(request: NextRequest, { params }: Contexto) {
  const { itemId } = await params

  let corpo: Record<string, unknown>
  try {
    corpo = await request.json()
  } catch {
    return resposta({ erro: 'corpo inválido' }, 400)
  }

  const { dia, hora } = corpo
  const nome = typeof corpo.nome === 'string' ? corpo.nome.trim().slice(0, 80) : ''
  const email = normalizarEmail(corpo.email)
  const telefone = typeof corpo.telefone === 'string' ? corpo.telefone.replace(/\D/g, '') : ''
  const observacao =
    typeof corpo.observacao === 'string' ? corpo.observacao.trim().slice(0, 500) : ''

  if (!ehDia(dia) || !ehHora(hora) || !nome || !email || !/^[0-9]{10,15}$/.test(telefone)) {
    return resposta({ erro: 'dados inválidos' }, 400)
  }

  const admin = createAdminClient()
  const agenda = await carregarAgenda(admin, itemId)
  if (!agenda) return resposta({ erro: 'agenda não encontrada' }, 404)

  try {
    const { count } = await admin
      .from('agendamentos')
      .select('id', { count: 'exact', head: true })
      .eq('item_id', agenda.id)
      .eq('telefone', telefone)
      .eq('status', 'pendente')
      .gte('dia', agoraNoFuso().dia)

    if ((count ?? 0) >= MAX_PENDENTES_POR_TELEFONE) {
      return resposta({ erro: 'limite' }, 429)
    }

    // Confere de novo no servidor: o horario pode ter sido ocupado, ou nunca
    // ter existido, entre o visitante abrir o calendario e enviar.
    if (!(await livresNoDia(admin, agenda, dia)).includes(hora)) {
      return resposta({ erro: 'ocupado' }, 409)
    }

    const { error } = await admin.from('agendamentos').insert({
      item_id: agenda.id,
      profile_id: agenda.profile_id,
      dia,
      hora,
      nome,
      email,
      telefone,
      observacao: observacao || null,
    })

    // 23505: outro pedido pegou o mesmo horario no mesmo instante.
    if (error?.code === '23505') return resposta({ erro: 'ocupado' }, 409)
    if (error) throw error

    return resposta({ ok: true }, 201)
  } catch (e) {
    console.error('[agenda] falha ao agendar', itemId, (e as Error).message)
    return resposta({ erro: 'falha' }, 500)
  }
}
