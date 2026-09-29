'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE_VOLTA, ehAdmin, lerVolta } from '@/lib/admin'
import { agendarPublicacao, removerHtml } from '@/lib/html-estatico'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// "Entrar como": o admin passa a usar uma sessao de verdade da conta, e nao um
// disfarce no app, porque as regras do banco (RLS) olham quem esta logado.
// O link magico e gerado pelo service_role e confirmado aqui mesmo: nenhum
// e-mail sai. A sessao do admin fica guardada (so o refresh token, em cookie
// httpOnly) para sairDoAmbiente() devolve-la.
export async function entrarComo(userId: string) {
  if (!(await ehAdmin())) return { erro: 'Sem permissão.' }

  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return { erro: 'Sessão expirada. Entre novamente.' }
  if (session.user.id === userId) return { erro: 'Essa já é a sua conta.' }

  const admin = createAdminClient()
  const { data: alvo } = await admin.auth.admin.getUserById(userId)
  const email = alvo?.user?.email
  if (!email) return { erro: 'Conta sem e-mail: não dá para entrar nela.' }

  const { data: link, error: erroLink } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  const token = link?.properties?.hashed_token
  if (erroLink || !token) return { erro: 'Não foi possível abrir a sessão da conta.' }

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_VOLTA, JSON.stringify({ r: session.refresh_token, alvo: userId }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  const { error } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: token })
  if (error) {
    cookieStore.delete(COOKIE_VOLTA)
    return { erro: 'Não foi possível abrir a sessão da conta.' }
  }

  console.info('[admin] entrou como', { admin: session.user.email, conta: email })
  redirect('/painel')
}

// Sai do ambiente da conta: encerra so a sessao aberta pelo "Entrar como"
// (as sessoes do proprio usuario continuam) e volta para a do admin.
export async function sairDoAmbiente() {
  const volta = await lerVolta()
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_VOLTA)
  if (!volta) redirect('/painel')

  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'local' })
  const { error } = await supabase.auth.refreshSession({ refresh_token: volta.r })
  if (error) redirect('/login')

  redirect('/painel/admin')
}

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
  await removerHtml(antes.username)
  await agendarPublicacao(username)
  revalidatePath('/painel', 'layout')
  revalidatePath('/painel/admin')

  return { ok: true as const, username }
}
