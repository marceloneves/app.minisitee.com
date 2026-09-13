import 'server-only'
import { cache } from 'react'
import { createPublicClient } from '@/lib/supabase/publico'
import type { PaginaCatalogo } from '@/lib/types'

// Sem cache entre requisicoes: a pagina e montada para gravar o HTML estatico
// logo depois de um salvamento e precisa do que acabou de ir para o banco.
// Visitante recebe o arquivo gravado, entao isto nao roda a cada visita.
async function buscarNoBanco(username: string): Promise<PaginaCatalogo | null> {
  const supabase = createPublicClient()
  const { data, error } = await supabase.rpc('get_catalog_page', {
    p_username: username,
  })

  if (error || !data) return null
  const pagina = data as PaginaCatalogo
  return pagina.profile ? pagina : null
}

// cache() do React deduplica dentro da mesma requisicao: a pagina, o
// generateMetadata e a imagem de compartilhamento compartilham a chamada.
export const buscarPagina = cache((username: string) => buscarNoBanco(username))
