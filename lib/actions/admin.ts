'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { ehAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function trocarSenha(userId: string, senha: string) {
  if (!(await ehAdmin())) return { erro: 'Sem permissão.' }
  if (senha.length < 6) return { erro: 'A senha precisa de pelo menos 6 caracteres.' }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(userId, { password: senha })

  if (error) return { erro: error.message }

  revalidatePath('/painel/admin')
  return { ok: true as const }
}

export async function excluirUsuario(userId: string) {
  if (!(await ehAdmin())) return { erro: 'Sem permissão.' }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)

  if (error) return { erro: error.message }

  revalidatePath('/painel/admin')
  return { ok: true as const }
}

export async function trocarPlano(userId: string, plan: 'free' | 'pro') {
  if (!(await ehAdmin())) return { erro: 'Sem permissão.' }

  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ plan }).eq('id', userId)

  if (error) return { erro: error.message }

  revalidatePath('/painel/admin')
  return { ok: true as const }
}

const USERNAME_RE = /^[a-z0-9_-]{7,30}$/

export async function trocarUsername(userId: string, novo: string) {
  if (!(await ehAdmin())) return { erro: 'Sem permissão.' }

  const username = novo.trim().toLowerCase()
  if (!USERNAME_RE.test(username)) {
    return { erro: 'Use 7 a 30 caracteres: letras minúsculas, números, hífen ou _.' }
  }

  const admin = createAdminClient()

  const { data: antes } = await admin
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .maybeSingle()

  if (!antes) return { erro: 'Esse usuário ainda não criou um minisitee.' }
  if (antes.username === username) return { ok: true as const }

  const { error } = await admin
    .from('profiles')
    .update({ username })
    .eq('id', userId)

  if (error) {
    if (error.code === '23505') return { erro: 'Esse endereço já está em uso.' }
    if (error.message.includes('username reservado')) {
      return { erro: 'Esse endereço é reservado pelo sistema.' }
    }
    if (error.code === '23514') return { erro: 'Formato inválido.' }
    return { erro: error.message }
  }

  // O endereço antigo e o novo saem do cache: um deixa de existir, o outro nasce.
  for (const nome of [antes.username, username]) {
    revalidatePath(`/${nome}`)
    revalidateTag(`catalogo:${nome}`)
  }
  revalidatePath('/painel', 'layout')
  revalidatePath('/painel/admin')

  return { ok: true as const, username }
}
