import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CabecalhoPainel } from '@/components/cabecalho-painel'
import { MinisiteeConteudo } from '@/components/minisitee-conteudo'
import { getUserId } from '@/lib/auth'
import { idiomaValido } from '@/lib/i18n/dicionarios'
import { getT } from '@/lib/i18n/servidor'
import { createClient } from '@/lib/supabase/server'
import { temaValido, type PaginaCatalogo } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function VisualizarPage() {
  const userId = await getUserId()
  if (!userId) redirect('/login')

  const t = await getT()
  const supabase = await createClient()

  const { data: perfil } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .maybeSingle()

  if (!perfil?.username) redirect('/painel/comecar')

  // Mesma RPC da página pública: a prévia mostra exatamente o que o visitante vê.
  const { data } = await supabase.rpc('get_catalog_page', {
    p_username: perfil.username,
  })

  const pagina = data as PaginaCatalogo | null
  if (!pagina?.profile) redirect('/painel')

  const { profile, items } = pagina
  const idioma = idiomaValido(profile.locale)

  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 py-6">
        <CabecalhoPainel
          titulo={t('verSite')}
          subtitulo={t('previaTexto')}
        />
        <Link
          href={`/${profile.username}`}
          className="mt-3 inline-block text-sm text-muted underline underline-offset-4"
        >
          {t('abrirPublico')}
        </Link>
      </div>

      <div
        data-tema={temaValido(profile.theme)}
        className="border-t border-border bg-bg text-fg"
      >
        <MinisiteeConteudo profile={profile} items={items} idioma={idioma} />
      </div>
    </div>
  )
}
