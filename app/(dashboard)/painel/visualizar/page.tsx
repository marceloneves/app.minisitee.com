import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BarraVoltar } from '@/components/barra-voltar'
import { CabecalhoPainel } from '@/components/cabecalho-painel'
import { MinisiteeConteudo } from '@/components/minisitee-conteudo'
import { MolduraCelular } from '@/components/moldura-celular'
import { getUserId } from '@/lib/auth'
import { idiomaValido } from '@/lib/i18n/dicionarios'
import { getT } from '@/lib/i18n/servidor'
import { createClient } from '@/lib/supabase/server'
import { atributosDoMinisite, estiloValido } from '@/lib/estilo'
import { urlPublica } from '@/lib/site'
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
      <BarraVoltar />
      <div className="mx-auto max-w-3xl px-4 py-6">
        <CabecalhoPainel
          titulo={t('verSite')}
          subtitulo={t('previaTexto')}
        />
        <Link
          href={urlPublica(profile.username)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm text-muted underline underline-offset-4"
        >
          {t('abrirPublico')}
        </Link>
      </div>

      <div className="flex justify-center px-4 pb-10">
        <MolduraCelular
          tela={atributosDoMinisite(temaValido(profile.theme), estiloValido(profile.estilo))}
        >
          <MinisiteeConteudo profile={profile} items={items} idioma={idioma} />
        </MolduraCelular>
      </div>
    </div>
  )
}
