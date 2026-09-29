import { notFound, redirect } from 'next/navigation'
import { ItemEditor, type ItemForm } from '@/components/item-editor'
import type { Foto } from '@/components/photo-uploader'
import { getUserId } from '@/lib/auth'
import { textoDoPreco } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'

export default async function EditorItemPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const userId = await getUserId()
  if (!userId) redirect('/login')

  const supabase = await createClient()

  const { data: item } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .eq('profile_id', userId)
    .maybeSingle()

  if (!item) notFound()

  // O Botao WhatsApp mostra o numero do perfil quando nao tem um proprio.
  const { data: perfil } = await supabase
    .from('profiles')
    .select('whatsapp')
    .eq('id', userId)
    .maybeSingle()

  const { data: fotos } = await supabase
    .from('item_photos')
    .select('id, url, position')
    .eq('item_id', id)
    .order('position')

  const inicial: ItemForm = {
    id: item.id,
    kind: (item.kind ?? 'produto') as ItemForm['kind'],
    // "Novo produto" era o titulo que a criacao gravava antes; no campo de
    // descricao ele so atrapalha, entao o produto abre com o campo vazio.
    title: item.kind === 'produto' && item.title === 'Novo produto' ? '' : (item.title ?? ''),
    url: item.url ?? '',
    whatsappMessage: item.whatsapp_message ?? '',
    dados: (item.data ?? {}) as ItemForm['dados'],
    status: item.status ?? 'rascunho',
    price: textoDoPreco(item.price_cents, item.price_note),
  }

  return (
    <ItemEditor
      inicial={inicial}
      fotosIniciais={(fotos ?? []) as Foto[]}
      whatsappDoPerfil={perfil?.whatsapp ?? null}
      ehNovo={item.created_at === item.updated_at}
    />
  )
}
