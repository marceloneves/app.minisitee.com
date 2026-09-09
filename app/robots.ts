import type { MetadataRoute } from 'next'
import { basePublica } from '@/lib/site'

// Sem robots.txt o buscador nao sabe onde esta o sitemap, e os minisites so
// entram no indice se alguem linkar. O painel fica de fora do rastreamento:
// e area logada, nao tem o que indexar.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/painel/', '/login', '/nova-senha', '/auth/', '/api/'],
    },
    sitemap: `${basePublica()}/sitemap.xml`,
  }
}
