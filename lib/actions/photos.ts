'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { agendarPublicacao } from '@/lib/html-estatico'
import { createClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/auth'
import { MAX_FOTOS } from '@/lib/constants'
import { caminhoDaUrl } from '@/lib/storage'

type Supabase = Awaited<ReturnType<typeof createClient>>

async function revalidarPublico(supabase: Supabase, userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .maybeSingle()

  if (data?.username) {
    revalidatePath(`/${data.username}`)
    revalidateTag(`catalogo:${data.username}`)
    agendarPublicacao(data.username)
  }
}

export async function registrarFoto(itemId: string, url: string) {
  const userId = await getUserId()
  if (!userId) return { erro: 'Sessão expirada.' }

  const supabase = await createClient()
  const { data: item } = await supabase
    .from('items')
    .select('id')
    .eq('id', itemId)
    .eq('profile_id', userId)
    .maybeSingle()

  if (!item) return { erro: 'Item não encontrado.' }

  const { count } = await supabase
    .from('item_photos')
    .select('id', { count: 'exact', head: true })
    .eq('item_id', itemId)

  if ((count ?? 0) >= MAX_FOTOS) {
    return { erro: `Máximo de ${MAX_FOTOS} fotos por item.` }
  }

  const { data, error } = await supabase
    .from('item_photos')
    .insert({ item_id: itemId, url, position: count ?? 0 })
    .select('id, url, position')
    .single()

  if (error || !data) return { erro: 'Não foi possível registrar a foto.' }

  revalidatePath(`/painel/item/${itemId}`)
  await revalidarPublico(supabase, userId)
  return { ok: true as const, foto: data }
}

export async function removerFoto(photoId: string) {
  const userId = await getUserId()
  if (!userId) return { erro: 'Sessão expirada.' }

  const supabase = await createClient()
  const { data: foto } = await supabase
    .from('item_photos')
    .select('id, url, item_id, items!inner(profile_id)')
    .eq('id', photoId)
    .maybeSingle()

  const dono = (foto?.items as unknown as { profile_id: string } | undefined)
    ?.profile_id
  if (!foto || dono !== userId) return { erro: 'Foto não encontrada.' }

  const caminho = caminhoDaUrl(foto.url)
  if (caminho) await supabase.storage.from('media').remove([caminho])

  const { error } = await supabase.from('item_photos').delete().eq('id', photoId)
  if (error) return { erro: 'Não foi possível remover.' }

  const { data: restantes } = await supabase
    .from('item_photos')
    .select('id')
    .eq('item_id', foto.item_id)
    .order('position')

  for (const [i, f] of (restantes ?? []).entries()) {
    await supabase.from('item_photos').update({ position: i }).eq('id', f.id)
  }

  revalidatePath(`/painel/item/${foto.item_id}`)
  await revalidarPublico(supabase, userId)
  return { ok: true as const }
}

export async function moverFoto(photoId: string, direcao: 'antes' | 'depois') {
  const userId = await getUserId()
  if (!userId) return { erro: 'Sessão expirada.' }

  const supabase = await createClient()
  const { data: foto } = await supabase
    .from('item_photos')
    .select('id, item_id, items!inner(profile_id)')
    .eq('id', photoId)
    .maybeSingle()

  const dono = (foto?.items as unknown as { profile_id: string } | undefined)
    ?.profile_id
  if (!foto || dono !== userId) return { erro: 'Foto não encontrada.' }

  const { data: lista } = await supabase
    .from('item_photos')
    .select('id, position')
    .eq('item_id', foto.item_id)
    .order('position')

  if (!lista) return { erro: 'Não foi possível reordenar.' }

  const i = lista.findIndex((f) => f.id === photoId)
  const alvo = direcao === 'antes' ? i - 1 : i + 1
  if (i === -1 || alvo < 0 || alvo >= lista.length) return { ok: true as const }

  const nova = [...lista]
  ;[nova[i], nova[alvo]] = [nova[alvo], nova[i]]

  for (const [pos, f] of nova.entries()) {
    if (f.position !== pos) {
      await supabase.from('item_photos').update({ position: pos }).eq('id', f.id)
    }
  }

  revalidatePath(`/painel/item/${foto.item_id}`)
  await revalidarPublico(supabase, userId)
  return { ok: true as const }
}
