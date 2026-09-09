import 'server-only'
import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import { createPublicClient } from '@/lib/supabase/publico'
import type { PaginaCatalogo } from '@/lib/types'

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

// cache() do React deduplica dentro da mesma requisicao: a pagina, o
// generateMetadata e a imagem de compartilhamento compartilham a chamada.
export const buscarPagina = cache((username: string) => buscarNoBanco(username))
