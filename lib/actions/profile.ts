'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/auth'
import { MAX_BIO } from '@/lib/constants'
import { agendarPublicacao } from '@/lib/html-estatico'
import { caminhoDaUrl } from '@/lib/storage'

const USERNAME_RE = /^[a-z0-9_-]{7,30}$/

export type DisponibilidadeUsername =
  | { status: 'livre' }
  | { status: 'invalido'; motivo: string }
  | { status: 'ocupado' }
  | { status: 'erro' }

export async function verificarUsername(
  username: string
): Promise<DisponibilidadeUsername> {
  const valor = username.trim().toLowerCase()

  if (valor.length < 7) {
    return { status: 'invalido', motivo: 'Use pelo menos 7 caracteres.' }
  }
  if (valor.length > 30) {
    return { status: 'invalido', motivo: 'Use no máximo 30 caracteres.' }
  }
  if (!USERNAME_RE.test(valor)) {
    return {
      status: 'invalido',
      motivo: 'Use apenas letras minúsculas, números, hífen e sublinhado.',
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('username_disponivel', {
    p_username: valor,
  })

  if (error) return { status: 'erro' }
  return data === true ? { status: 'livre' } : { status: 'ocupado' }
}

export type CriarProfileInput = {
  username: string
  displayName: string
  headline: string
  city: string
  whatsapp: string
  locale: string
}

export async function criarProfile(input: CriarProfileInput) {
  const userId = await getUserId()
  if (!userId) return { erro: 'Sessão expirada. Entre novamente.' }

  const username = input.username.trim().toLowerCase()
  if (!USERNAME_RE.test(username)) {
    return { erro: 'Esse endereço não está disponível' }
  }
  if (!input.displayName.trim()) {
    return { erro: 'Informe seu nome completo.' }
  }
  if (!/^[0-9]{10,15}$/.test(input.whatsapp)) {
    return { erro: 'Informe um WhatsApp válido com DDD.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').insert({
    id: userId,
    username,
    display_name: input.displayName.trim(),
    headline: input.headline.trim() || null,
    city: input.city.trim() || null,
    whatsapp: input.whatsapp,
    locale: ['pt', 'en', 'es'].includes(input.locale) ? input.locale : 'pt',
  })

  if (error) {
    if (error.code === '23505' || error.message.includes('username reservado')) {
      return { erro: 'Esse endereço não está disponível' }
    }
    if (error.code === '23514') {
      return { erro: 'Confira os dados: algum campo está fora do formato.' }
    }
    return { erro: 'Não foi possível salvar. Tente de novo.' }
  }

  revalidatePath('/painel', 'layout')
  agendarPublicacao(username)
  return { ok: true as const }
}

export type AtualizarProfileInput = {
  displayName: string
  headline: string
  bio: string
  city: string
  whatsapp: string
  locale: string
}

export async function atualizarProfile(input: AtualizarProfileInput) {
  const userId = await getUserId()
  if (!userId) return { erro: 'Sessão expirada. Entre novamente.' }

  if (!input.displayName.trim()) {
    return { erro: 'Informe seu nome.' }
  }
  if (!/^[0-9]{10,15}$/.test(input.whatsapp)) {
    return { erro: 'Informe um WhatsApp válido com DDD.' }
  }

  const supabase = await createClient()
  const { data: atual } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .maybeSingle()

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: input.displayName.trim(),
      headline: input.headline.trim() || null,
      bio: input.bio.trim().slice(0, MAX_BIO) || null,
      city: input.city.trim() || null,
      whatsapp: input.whatsapp,
      locale: ['pt', 'en', 'es'].includes(input.locale) ? input.locale : 'pt',
    })
    .eq('id', userId)

  if (error) {
    if (error.code === '23514') {
      return { erro: 'Confira os dados: algum campo está fora do formato.' }
    }
    return { erro: 'Não foi possível salvar.' }
  }

  revalidatePath('/painel', 'layout')
  if (atual?.username) {
    revalidatePath(`/${atual.username}`)
    revalidateTag(`catalogo:${atual.username}`)
    agendarPublicacao(atual.username)
  }
  return { ok: true as const }
}

export async function atualizarEstilo(theme: string) {
  const userId = await getUserId()
  if (!userId) return { erro: 'Sessão expirada. Entre novamente.' }

  const supabase = await createClient()
  const { data: perfil } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .maybeSingle()

  const { error } = await supabase
    .from('profiles')
    .update({ theme })
    .eq('id', userId)

  if (error) return { erro: 'Não foi possível salvar o estilo.' }

  revalidatePath('/painel', 'layout')
  if (perfil?.username) {
    revalidatePath(`/${perfil.username}`)
    revalidateTag(`catalogo:${perfil.username}`)
    agendarPublicacao(perfil.username)
  }
  return { ok: true as const }
}


async function revalidarPerfil(username: string | null) {
  revalidatePath('/painel', 'layout')
  if (username) {
    revalidatePath(`/${username}`)
    revalidateTag(`catalogo:${username}`)
    agendarPublicacao(username)
  }
}

export async function definirAvatar(url: string) {
  const userId = await getUserId()
  if (!userId) return { erro: 'Sessão expirada. Entre novamente.' }

  // So aceita arquivo do proprio usuario no bucket: a URL vem do cliente.
  const caminho = caminhoDaUrl(url)
  if (!caminho || !caminho.startsWith(`${userId}/`)) {
    return { erro: 'Imagem inválida.' }
  }

  const supabase = await createClient()
  const { data: atual } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', userId)
    .maybeSingle()

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: url })
    .eq('id', userId)

  if (error) return { erro: 'Não foi possível salvar a imagem.' }

  const anterior = atual?.avatar_url ? caminhoDaUrl(atual.avatar_url) : null
  if (anterior && anterior !== caminho) {
    await supabase.storage.from('media').remove([anterior])
  }

  await revalidarPerfil(atual?.username ?? null)
  return { ok: true as const }
}

export async function removerAvatar() {
  const userId = await getUserId()
  if (!userId) return { erro: 'Sessão expirada. Entre novamente.' }

  const supabase = await createClient()
  const { data: atual } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', userId)
    .maybeSingle()

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', userId)

  if (error) return { erro: 'Não foi possível remover a imagem.' }

  const caminho = atual?.avatar_url ? caminhoDaUrl(atual.avatar_url) : null
  if (caminho) await supabase.storage.from('media').remove([caminho])

  await revalidarPerfil(atual?.username ?? null)
  return { ok: true as const }
}
