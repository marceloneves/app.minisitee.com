import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { MinisiteeConteudo } from '@/components/minisitee-conteudo'
import { buscarPagina } from '@/lib/catalogo'
import { montarSchema, serializarSchema } from '@/lib/schema'
import { ProvedorIdioma } from '@/lib/i18n/contexto'
import { DICIONARIOS, OG_LOCALE, idiomaValido } from '@/lib/i18n/dicionarios'
import { MAX_BIO } from '@/lib/constants'
import { basePublica } from '@/lib/site'
import { estiloPorValor, imagemEstilo, temaValido } from '@/lib/types'

export const revalidate = 3600

// Sem theme-color a barra do navegador no Android fica cinza em cima da
// pagina. A cor nao pode ser fixa: nos estilos de fundo escuro uma barra
// branca deixaria uma faixa clara em cima de uma pagina escura. buscarPagina
// esta memoizada por requisicao, entao isto nao custa outra ida ao banco.
export async function generateViewport({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Viewport> {
  const { username } = await params
  const pagina = await buscarPagina(username)
  const estilo = estiloPorValor(temaValido(pagina?.profile?.theme))
  return { themeColor: estilo.escuro ? estilo.superficie : '#ffffff' }
}

// Descricoes gravadas antes do limite podem passar de MAX_BIO; o Google corta
// por volta disso, entao o corte sai aqui e cai numa palavra inteira.
function resumir(texto: string) {
  const limpo = texto.trim()
  if (limpo.length <= MAX_BIO) return limpo
  const corte = limpo.slice(0, MAX_BIO)
  const espaco = corte.lastIndexOf(' ')
  return `${(espaco > MAX_BIO / 2 ? corte.slice(0, espaco) : corte).trimEnd()}…`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const pagina = await buscarPagina(username)

  if (!pagina?.profile) return { title: { absolute: 'Página não encontrada' } }

  const { profile, items } = pagina
  const idioma = idiomaValido(profile.locale)
  const d = DICIONARIOS[idioma]
  const nome = profile.display_name ?? profile.username
  const local = profile.city ? ` ${d.emCidade} ${profile.city}` : ''
  // Quem procura negocio local busca pelo lugar: o title segue o padrao
  // "tipo de negocio em <cidade>", que e como a pessoa digita na busca.
  const titulo = profile.headline
    ? `${nome} — ${profile.headline}${local}`
    : `${nome}${local}`
  // A descricao do negocio e o que o dono escreveu para aparecer na busca. So
  // quando ela esta vazia o resumo do catalogo entra no lugar.
  const descricao =
    resumir(profile.bio ?? '') ||
    `${items.length} ${items.length === 1 ? 'item disponível' : 'itens disponíveis'}${local}. Fale direto no WhatsApp.`

  return {
    // absolute derruba o template do layout: o minisite e da pessoa, o nome
    // do produto nao entra no title nem gasta o espaco que o Google mostra.
    title: { absolute: titulo },
    description: descricao,
    alternates: { canonical: `/${profile.username}` },
    // O padrao do Google ja e indexar, mas sem max-image-preview grande a foto
    // do negocio sai como miniatura na busca e no Discover.
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    // A aba e o atalho na tela de inicio ficam com a cara do negocio, nao com
    // o icone do minisitee.
    icons: profile.avatar_url
      ? { icon: profile.avatar_url, apple: profile.avatar_url }
      : undefined,
    // Sem `images` aqui, o Next preenche og:image e twitter:image com o cartao
    // de opengraph-image.tsx, ja com largura, altura e tipo.
    openGraph: {
      type: 'profile',
      siteName: nome,
      locale: OG_LOCALE[idioma],
      title: titulo,
      description: descricao,
      url: `/${profile.username}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: titulo,
      description: descricao,
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
  const tema = temaValido(profile.theme)
  const fundo = imagemEstilo(tema)

  const base = basePublica()

  return (
    <ProvedorIdioma idioma={idioma}>
      {/* O <html> do layout raiz e sempre pt-BR; o minisite pode estar em
          outro idioma, e o lang aqui manda no leitor de tela e na busca. */}
      {/* A foto do estilo entra pelo CSS, em background-image. O preload
          adianta o download: sem ele o navegador so descobre a imagem depois
          de baixar e ler a folha de estilo inteira. */}
      {fundo && <link rel="preload" as="image" href={fundo} />}
      <div
        lang={idioma}
        data-tema={tema}
        className={`min-h-dvh bg-bg text-fg${fundo ? ' fundo-estilo' : ''}`}
      >
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
