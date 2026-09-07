import { MAX_ITENS_FREE } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'

export async function podeCriarItem(userId: string) {
  const supabase = await createClient()

  const { data: perfil } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .maybeSingle()

  if ((perfil?.plan ?? 'free') !== 'free') return true

  const { count } = await supabase
    .from('items')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', userId)

  return (count ?? 0) < MAX_ITENS_FREE
}
