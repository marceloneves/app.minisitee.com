import type { ItemPublico, PerfilPublico } from '@/lib/types'

const DIA_SCHEMA: Record<string, string> = {
  seg: 'Monday',
  ter: 'Tuesday',
  qua: 'Wednesday',
  qui: 'Thursday',
  sex: 'Friday',
  sab: 'Saturday',
  dom: 'Sunday',
}

type No = Record<string, unknown>

export function montarSchema(
  profile: PerfilPublico,
  items: ItemPublico[],
  base: string
) {
  const url = `${base}/${profile.username}`
  const nome = profile.display_name ?? profile.username

  const endereco = items.find((i) => i.kind === 'endereco')?.data?.endereco
  const horario = items.find((i) => i.kind === 'horario')?.data?.dias
  const redes = items
    .filter((i) => i.kind === 'redes')
    .flatMap((i) => i.data?.links ?? [])
    .map((l) => l.url)
    .filter(Boolean)

  const negocio: No = {
    '@type': endereco ? 'LocalBusiness' : 'Person',
    '@id': `${url}#perfil`,
    name: nome,
    url,
  }

  if (profile.headline) negocio.description = profile.headline
  if (profile.bio) negocio.description = profile.bio
  if (profile.avatar_url) negocio.image = profile.avatar_url
  if (profile.whatsapp) negocio.telephone = `+${profile.whatsapp}`
  if (redes.length) negocio.sameAs = redes

  if (endereco) {
    negocio.address = {
      '@type': 'PostalAddress',
      streetAddress: endereco,
      addressLocality: profile.city ?? undefined,
    }
  } else if (profile.city) {
    negocio.address = { '@type': 'PostalAddress', addressLocality: profile.city }
  }

  const abertos = (horario ?? []).filter((d) => !d.fechado && d.abre && d.fecha)
  if (abertos.length) {
    negocio.openingHoursSpecification = abertos.map((d) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${DIA_SCHEMA[d.dia] ?? d.dia}`,
      opens: d.abre,
      closes: d.fecha,
    }))
  }

  const grafo: No[] = [negocio]

  const produtos = items.filter((i) => i.kind === 'produto')
  if (produtos.length) {
    grafo.push({
      '@type': 'ItemList',
      '@id': `${url}#catalogo`,
      numberOfItems: produtos.length,
      itemListElement: produtos.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.title,
          url: `${url}/${p.slug}`,
          ...(p.cover_url ? { image: p.cover_url } : {}),
          ...(p.category ? { category: p.category } : {}),
          ...(p.price_cents
            ? {
                offers: {
                  '@type': 'Offer',
                  price: (p.price_cents / 100).toFixed(2),
                  priceCurrency: 'BRL',
                  availability:
                    p.status === 'reservado'
                      ? 'https://schema.org/PreOrder'
                      : 'https://schema.org/InStock',
                },
              }
            : {}),
        },
      })),
    })
  }

  const perguntas = items
    .filter((i) => i.kind === 'faq')
    .flatMap((i) => i.data?.perguntas ?? [])
    .filter((q) => q.p.trim() && q.r.trim())

  if (perguntas.length) {
    grafo.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: perguntas.map((q) => ({
        '@type': 'Question',
        name: q.p,
        acceptedAnswer: { '@type': 'Answer', text: q.r },
      })),
    })
  }

  return { '@context': 'https://schema.org', '@graph': grafo }
}

export function serializarSchema(schema: unknown) {
  // Escapa < para o JSON nunca poder fechar a tag <script>.
  return JSON.stringify(schema).replace(/</g, '\\u003c')
}
