'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/auth'
import { slugify } from '@/lib/slug'
import { horarioPadrao, type DadosItem, type TipoItem } from '@/lib/types'

type Supabase = Awaited<ReturnType<typeof createClient>>

async function exigirDono(supabase: Supabase, itemId: string, userId: string) {
  const { data } = await supabase
    .from('items')
    .select('id, profile_id')
    .eq('id', itemId)
    .maybeSingle()

  return data && data.profile_id === userId ? data : null
}

async function slugDisponivel(
  supabase: Supabase,
  profileId: string,
  base: string,
  ignorarId?: string
) {
  const raiz = base || 'item'
  const { data } = await supabase
    .from('items')
    .select('id, slug')
    .eq('profile_id', profileId)
    .like('slug', `${raiz}%`)

  const tomados = new Set(
    (data ?? []).filter((r) => r.id !== ignorarId).map((r) => r.slug)
  )

  if (!tomados.has(raiz)) return raiz
  for (let i = 2; i < 500; i++) {
    const tentativa = `${raiz.slice(0, 57)}-${i}`
    if (!tomados.has(tentativa)) return tentativa
  }
  return `${raiz.slice(0, 50)}-${Date.now().toString(36)}`
}

const TITULO_PADRAO: Record<string, string> = {
  produto: 'Novo produto',
  whatsapp: 'Falar no WhatsApp',
  telefone: 'Ligar agora',
  link: 'Novo link',
  redes: 'Redes sociais',
  horario: 'Horário de funcionamento',
  endereco: 'Onde estamos',
  galeria: 'Galeria de fotos',
  faq: 'Perguntas frequentes',
  arquivo: 'Baixar arquivo',
  contagem: 'Contagem regressiva',
}

export async function criarRascunho(kind: TipoItem = 'produto') {
  const userId = await getUserId()
  if (!userId) redirect('/login')

  const supabase = await createClient()
  const titulo = TITULO_PADRAO[kind] ?? 'Novo item'
  const slug = await slugDisponivel(supabase, userId, slugify(titulo))

  const { count } = await supabase
    .from('items')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', userId)

  const { data, error } = await supabase
    .from('items')
    .insert({
      profile_id: userId,
      slug,
      kind,
      title: titulo,
      status: 'rascunho',
      position: count ?? 0,
      ...(kind === 'link' ? { url: 'https://' } : {}),
      ...(kind === 'horario' ? { data: { dias: horarioPadrao() } } : {}),
      ...(kind === 'redes' ? { data: { links: [] } } : {}),
      ...(kind === 'faq' ? { data: { perguntas: [{ p: '', r: '' }] } } : {}),
    })
    .select('id')
    .single()

  if (error || !data) return { erro: 'Não foi possível criar o item.' }

  revalidatePath('/painel')
  redirect(`/painel/item/${data.id}`)
}

export type PatchItem = {
  title?: string
  url?: string | null
  whatsapp_message?: string | null
  data?: DadosItem
  slug?: string
  description?: string | null
  category?: string | null
  status?: string
  price_cents?: number | null
  price_note?: string | null
  location?: string | null
}

export async function salvarItem(id: string, patch: PatchItem) {
  const userId = await getUserId()
  if (!userId) return { erro: 'Sessão expirada. Entre novamente.' }

  const supabase = await createClient()
  if (!(await exigirDono(supabase, id, userId))) {
    return { erro: 'Item não encontrado.' }
  }

  const dados: PatchItem = { ...patch }

  if (patch.slug !== undefined) {
    const base = slugify(patch.slug) || slugify(patch.title ?? '') || 'item'
    dados.slug = await slugDisponivel(supabase, userId, base, id)
  }

  const { error } = await supabase
    .from('items')
    .update(dados)
    .eq('id', id)
    .eq('profile_id', userId)

  if (error) return { erro: 'Não foi possível salvar.' }

  revalidatePath('/painel')
  revalidatePath(`/painel/item/${id}`)
  return { ok: true as const, slug: dados.slug }
}

export async function duplicarItem(id: string) {
  const userId = await getUserId()
  if (!userId) return { erro: 'Sessão expirada.' }

  const supabase = await createClient()
  const { data: origem } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .eq('profile_id', userId)
    .maybeSingle()

  if (!origem) return { erro: 'Item não encontrado.' }

  const slug = await slugDisponivel(supabase, userId, origem.slug)
  const descartar = new Set(['id', 'created_at', 'updated_at'])
  const resto = Object.fromEntries(
    Object.entries(origem).filter(([chave]) => !descartar.has(chave))
  )

  const { data: novo, error } = await supabase
    .from('items')
    .insert({
      ...resto,
      slug,
      title: `${origem.title} (cópia)`,
      status: 'rascunho',
    })
    .select('id')
    .single()

  if (error || !novo) return { erro: 'Não foi possível duplicar.' }

  const { data: fotos } = await supabase
    .from('item_photos')
    .select('url, position')
    .eq('item_id', id)
    .order('position')

  if (fotos?.length) {
    await supabase
      .from('item_photos')
      .insert(fotos.map((f) => ({ ...f, item_id: novo.id })))
  }

  revalidatePath('/painel')
  return { ok: true as const, id: novo.id }
}

export async function excluirItem(id: string) {
  const userId = await getUserId()
  if (!userId) return { erro: 'Sessão expirada.' }

  const supabase = await createClient()
  if (!(await exigirDono(supabase, id, userId))) {
    return { erro: 'Item não encontrado.' }
  }

  const pasta = `${userId}/${id}`
  const { data: arquivos } = await supabase.storage.from('media').list(pasta)
  if (arquivos?.length) {
    await supabase.storage
      .from('media')
      .remove(arquivos.map((a) => `${pasta}/${a.name}`))
  }

  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id)
    .eq('profile_id', userId)

  if (error) return { erro: 'Não foi possível excluir.' }

  revalidatePath('/painel')
  return { ok: true as const }
}

export async function moverItem(id: string, direcao: 'cima' | 'baixo') {
  const userId = await getUserId()
  if (!userId) return { erro: 'Sessão expirada.' }

  const supabase = await createClient()
  const { data: lista } = await supabase
    .from('items')
    .select('id, position')
    .eq('profile_id', userId)
    .order('position')
    .order('created_at')

  if (!lista) return { erro: 'Não foi possível reordenar.' }

  const indice = lista.findIndex((p) => p.id === id)
  const alvo = direcao === 'cima' ? indice - 1 : indice + 1
  if (indice === -1 || alvo < 0 || alvo >= lista.length) {
    return { ok: true as const }
  }

  const reordenada = [...lista]
  ;[reordenada[indice], reordenada[alvo]] = [reordenada[alvo], reordenada[indice]]

  for (const [i, item] of reordenada.entries()) {
    if (item.position !== i) {
      await supabase
        .from('items')
        .update({ position: i })
        .eq('id', item.id)
        .eq('profile_id', userId)
    }
  }

  revalidatePath('/painel')
  return { ok: true as const }
}
