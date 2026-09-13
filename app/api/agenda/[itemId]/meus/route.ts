import type { NextRequest } from 'next/server'
import {
  agoraNoFuso,
  configAgenda,
  ehDia,
  ehHora,
  respeitaAntecedencia,
} from '@/lib/agenda'
import {
  carregarAgenda,
  lerAcesso,
  livresNoDia,
  resposta,
} from '@/lib/agenda-servidor'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type Contexto = { params: Promise<{ itemId: string }> }

export async function GET(request: NextRequest, { params }: Contexto) {
  const { itemId } = await params
  const email = lerAcesso(request, itemId)
  if (!email) return resposta({ erro: 'sem acesso' }, 401)

  const admin = createAdminClient()
  const agenda = await carregarAgenda(admin, itemId)
  if (!agenda) return resposta({ erro: 'agenda não encontrada' }, 404)

  const agora = agoraNoFuso()
  const config = configAgenda(agenda.data)
  const { data, error } = await admin
    .from('agendamentos')
    .select('id, dia, hora, status')
    .eq('item_id', agenda.id)
    .eq('email', email)
    .gte('dia', agora.dia)
    .order('dia')
    .order('hora')

  if (error) {
    console.error('[agenda] falha ao listar do visitante', itemId, error.message)
    return resposta({ erro: 'falha' }, 500)
  }

  return resposta({
    agendamentos: (data ?? []).map((a) => {
      const hora = String(a.hora).slice(0, 5)
      return {
        id: a.id,
        dia: a.dia,
        hora,
        status: a.status,
        alteravel: a.status !== 'cancelado' && respeitaAntecedencia(config, a.dia, hora, agora),
      }
    }),
  })
}

export async function POST(request: NextRequest, { params }: Contexto) {
  const { itemId } = await params
  const email = lerAcesso(request, itemId)
  if (!email) return resposta({ erro: 'sem acesso' }, 401)

  let corpo: Record<string, unknown>
  try {
    corpo = await request.json()
  } catch {
    return resposta({ erro: 'corpo inválido' }, 400)
  }

  const { acao, id } = corpo
  if ((acao !== 'cancelar' && acao !== 'remarcar') || typeof id !== 'string') {
    return resposta({ erro: 'dados inválidos' }, 400)
  }

  const admin = createAdminClient()
  const agenda = await carregarAgenda(admin, itemId)
  if (!agenda) return resposta({ erro: 'agenda não encontrada' }, 404)

  try {
    const { data: agendamento } = await admin
      .from('agendamentos')
      .select('id, dia, hora, status, email')
      .eq('id', id)
      .eq('item_id', agenda.id)
      .maybeSingle()

    // Agendamento de outro e-mail responde igual a inexistente.
    if (!agendamento || agendamento.email !== email) {
      return resposta({ erro: 'não encontrado' }, 404)
    }
    if (agendamento.status === 'cancelado') return resposta({ erro: 'cancelado' }, 409)

    // A mesma antecedencia que vale para marcar vale para desmarcar: o dono
    // nao descobre em cima da hora que o horario ficou vago.
    const agora = agoraNoFuso()
    const config = configAgenda(agenda.data)
    if (!respeitaAntecedencia(config, agendamento.dia, String(agendamento.hora).slice(0, 5), agora)) {
      return resposta({ erro: 'emCimaDaHora' }, 409)
    }

    if (acao === 'cancelar') {
      const { error } = await admin
        .from('agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', agendamento.id)
      if (error) throw error
      return resposta({ ok: true })
    }

    const { dia, hora } = corpo
    if (!ehDia(dia) || !ehHora(hora)) return resposta({ erro: 'dados inválidos' }, 400)
    if (!(await livresNoDia(admin, agenda, dia, agendamento.id)).includes(hora)) {
      return resposta({ erro: 'ocupado' }, 409)
    }

    // Horario novo volta a pendente: o dono confirma de novo.
    const { error } = await admin
      .from('agendamentos')
      .update({ dia, hora, status: 'pendente' })
      .eq('id', agendamento.id)
    if (error?.code === '23505') return resposta({ erro: 'ocupado' }, 409)
    if (error) throw error

    return resposta({ ok: true })
  } catch (e) {
    console.error('[agenda] falha ao alterar do visitante', itemId, (e as Error).message)
    return resposta({ erro: 'falha' }, 500)
  }
}
