'use server'

import { revalidatePath } from 'next/cache'
import { getUserId } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function marcarResposta(id: string, lida: boolean) {
  const userId = await getUserId()
  if (!userId) return { erro: 'Sessão expirada. Entre novamente.' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('respostas_formulario')
    .update({ lida: Boolean(lida) })
    .eq('id', id)
    .eq('profile_id', userId)
    .select('id')
    .maybeSingle()

  if (error || !data) return { erro: 'Não foi possível atualizar a resposta.' }

  revalidatePath('/painel/respostas')
  return { ok: true as const }
}

export async function excluirResposta(id: string) {
  const userId = await getUserId()
  if (!userId) return { erro: 'Sessão expirada. Entre novamente.' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('respostas_formulario')
    .delete()
    .eq('id', id)
    .eq('profile_id', userId)
    .select('id')
    .maybeSingle()

  if (error || !data) return { erro: 'Não foi possível excluir a resposta.' }

  revalidatePath('/painel/respostas')
  return { ok: true as const }
}
