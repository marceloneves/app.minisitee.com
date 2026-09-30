import { redirect } from 'next/navigation'
import { CabecalhoPainel } from '@/components/cabecalho-painel'
import { SeletorTipoItem } from '@/components/seletor-tipo-item'
import { getUserId } from '@/lib/auth'
import { getIdioma, getT } from '@/lib/i18n/servidor'
import { createClient } from '@/lib/supabase/server'

export default async function NovoItemPage() {
  const t = await getT()
  const idioma = await getIdioma()

  const userId = await getUserId()
  if (!userId) redirect('/login')

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .maybeSingle()

  const { count: agendas } = await supabase
    .from('items')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', userId)
    .eq('kind', 'agenda')

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <CabecalhoPainel titulo={t('oQueAdicionar')} subtitulo={t('escolhaTipo')} />

      <SeletorTipoItem
        idioma={idioma}
        temAgenda={(agendas ?? 0) > 0}
        ehFree={(profile?.plan ?? 'free') === 'free'}
      />
    </main>
  )
}
