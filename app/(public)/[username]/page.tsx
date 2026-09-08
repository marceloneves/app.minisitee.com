import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import { MinisiteeConteudo } from '@/components/minisitee-conteudo'
import { montarSchema, serializarSchema } from '@/lib/schema'
import { createPublicClient } from '@/lib/supabase/publico'
import { ProvedorIdioma } from '@/lib/i18n/contexto'
import { idiomaValido } from '@/lib/i18n/dicionarios'
import { temaValido, type PaginaCatalogo } from '@/lib/types'

export const revalidate = 3600

// unstable_cache guarda o resultado entre requisicoes. Sem isso cada visita
// faz um POST na RPC, e POST o Next nunca cacheia sozinho.
const buscarNoBanco = (username: string) =>
  unstable_cache(
    async (): Promise<PaginaCatalogo | null> => {
      const supabase = createPublicClient()
      const { data, error } = await supabase.rpc('get_catalog_page', {
        p_username: username,
      })

      if (error || !data) return null
      const pagina = data as PaginaCatalogo
      return pagina.profile ? pagina : null
    },
    ['catalogo', username],
    { tags: [`catalogo:${username}`], revalidate: 3600 }
  )()

// cache() do React deduplica dentro da mesma requisicao: generateMetadata e a
// pagina compartilham a chamada.
const buscarPagina = cache((username: string) => buscarNoBanco(username))

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const pagina = await buscarPagina(username)

  if (!pagina?.profile) return { title: 'Página não encontrada' }

  const { profile, items } = pagina
  const nome = profile.display_name ?? profile.username
  const local = profile.city ? ` em ${profile.city}` : ''
  const titulo = profile.headline ? `${nome} — ${profile.headline}` : nome
  const descricao =
    profile.bio?.trim() ||
    `${items.length} ${items.length === 1 ? 'item disponível' : 'itens disponíveis'}${local}. Fale direto no WhatsApp.`

  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: `/${profile.username}` },
    openGraph: {
      type: 'profile',
      title: titulo,
      description: descricao,
      url: `/${profile.username}`,
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : undefined,
    },
    twitter: {
      card: 'summary',
      title: titulo,
      description: descricao,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  }
}

export default async function CatalogoPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const pagina = await buscarPagina(username)

  if (!pagina?.profile) notFound()

  const { profile, items } = pagina
  const idioma = idiomaValido(profile.locale)

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://minisitee.com'

  return (
    <ProvedorIdioma idioma={idioma}>
      <div data-tema={temaValido(profile.theme)} className="min-h-dvh bg-bg text-fg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializarSchema(montarSchema(profile, items, base)),
        }}
      />
      <MinisiteeConteudo profile={profile} items={items} idioma={idioma} />
      </div>
    </ProvedorIdioma>
  )
}
