'use server'

import { revalidatePath } from 'next/cache'
import { getUserId } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function mudarStatusAgendamento(id: string, status: 'confirmado' | 'cancelado') {
  const userId = await getUserId()
  if (!userId) return { erro: 'Sessão expirada. Entre novamente.' }
  if (status !== 'confirmado' && status !== 'cancelado') return { erro: 'Status inválido.' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('agendamentos')
    .update({ status })
    .eq('id', id)
    .eq('profile_id', userId)
    .select('id')
    .maybeSingle()

  // 23505: o horario foi liberado por um cancelamento e outro cliente ja o pegou.
  if (error?.code === '23505') {
    return { erro: 'Esse horário já foi ocupado por outro agendamento.' }
  }
  if (error || !data) return { erro: 'Não foi possível atualizar o agendamento.' }

  revalidatePath('/painel/agenda')
  return { ok: true as const }
}
