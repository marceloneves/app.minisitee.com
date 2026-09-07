import { redirect } from 'next/navigation'
import { EditorEstilo } from '@/components/editor-estilo'
import { getUserId } from '@/lib/auth'
import { getT } from '@/lib/i18n/servidor'
import { createClient } from '@/lib/supabase/server'

export default async function EstiloPage() {
  const userId = await getUserId()
  if (!userId) redirect('/login')

  const t = await getT()
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('theme')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) redirect('/painel/comecar')

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="text-xl font-semibold tracking-tight">{t('estiloTitulo')}</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
{t('estiloSubtitulo')}
      </p>
      <EditorEstilo inicial={profile.theme ?? 'light'} />
    </main>
  )
}
