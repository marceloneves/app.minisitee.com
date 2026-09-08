import { notFound, redirect } from 'next/navigation'
import { ItemEditor, type ItemForm } from '@/components/item-editor'
import type { Foto } from '@/components/photo-uploader'
import { getUserId } from '@/lib/auth'
import { centsToCurrency } from '@/lib/mask'
import { slugify } from '@/lib/slug'
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
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
    title: item.title ?? '',
    url: item.url ?? '',
    whatsappMessage: item.whatsapp_message ?? '',
    dados: (item.data ?? {}) as ItemForm['dados'],
    slug: item.slug ?? '',
    description: item.description ?? '',
    category: item.category ?? '',
    status: item.status ?? 'rascunho',
    price: centsToCurrency(item.price_cents),
    priceNote: item.price_note ?? '',
    location: item.location ?? '',
  }

  return (
    <ItemEditor
      inicial={inicial}
      username={profile?.username ?? ''}
      fotosIniciais={(fotos ?? []) as Foto[]}
      slugManualInicial={item.slug !== slugify(item.title ?? '')}
      ehNovo={item.created_at === item.updated_at}
    />
  )
}
