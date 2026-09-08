import { redirect } from 'next/navigation'
import { CabecalhoPainel } from '@/components/cabecalho-painel'
import { EditorEstilo } from '@/components/editor-estilo'
import { MinisiteeConteudo } from '@/components/minisitee-conteudo'
import { getUserId } from '@/lib/auth'
import { idiomaValido } from '@/lib/i18n/dicionarios'
import { getT } from '@/lib/i18n/servidor'
import { createClient } from '@/lib/supabase/server'
import type { PaginaCatalogo } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function EstiloPage() {
  const userId = await getUserId()
  if (!userId) redirect('/login')

  const t = await getT()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('theme, username')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) redirect('/painel/comecar')

  const { data } = await supabase.rpc('get_catalog_page', {
    p_username: profile.username,
  })
  const pagina = data as PaginaCatalogo | null

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <CabecalhoPainel
        titulo={t('estiloTitulo')}
        subtitulo={t('estiloSubtitulo')}
      />

      <div className="mt-6" />

      <EditorEstilo
        inicial={profile.theme ?? 'light'}
        previa={
          pagina?.profile ? (
            <MinisiteeConteudo
              profile={pagina.profile}
              items={pagina.items}
              idioma={idiomaValido(pagina.profile.locale)}
            />
          ) : null
        }
      />
    </main>
  )
}
