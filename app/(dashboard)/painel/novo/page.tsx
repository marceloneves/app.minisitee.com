import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SeletorTipoItem } from '@/components/seletor-tipo-item'
import { getUserId } from '@/lib/auth'
import { MAX_ITENS_FREE } from '@/lib/constants'
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

  const { count } = await supabase
    .from('items')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', userId)

  if ((profile?.plan ?? 'free') === 'free' && (count ?? 0) >= MAX_ITENS_FREE) {
    redirect('/painel')
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <Link href="/painel" className="text-sm text-muted underline underline-offset-4">
        {t('voltar')}
      </Link>

      <h1 className="mt-4 text-xl font-semibold tracking-tight">
        {t('oQueAdicionar')}
      </h1>
      <p className="mt-1 text-sm text-muted">{t('escolhaTipo')}</p>

      <SeletorTipoItem idioma={idioma} />
    </main>
  )
}
