import type { MetadataRoute } from 'next'
import { basePublica } from '@/lib/site'
import { createAdminClient, temChaveAdmin } from '@/lib/supabase/admin'

export const revalidate = 3600

// A RLS de profiles so deixa o dono ler a propria linha, entao a lista sai
// pela chave de servico. Fica no servidor: sitemap.ts nunca vai para o cliente.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = basePublica()
  const raiz = [{ url: base }]

  if (!temChaveAdmin()) return raiz

  const admin = createAdminClient()
  const perfis = await admin.from('profiles').select('id, username, updated_at')
  if (perfis.error || !perfis.data) return raiz

  // A data que importa e a da ultima mudanca visivel: mexer num item muda o
  // minisite tanto quanto mexer no perfil.
  //
  // O PostgREST devolve no maximo mil linhas por chamada. Sem paginar, a
  // partir de mil itens no total os minisites do fim da lista sumiriam do
  // sitemap por parecerem vazios.
  const ultimaMudanca = new Map<string, string>()
  const PAGINA = 1000

  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await admin
      .from('items')
      .select('profile_id, updated_at')
      .in('status', ['ativo', 'reservado'])
      .order('profile_id')
      .range(inicio, inicio + PAGINA - 1)

    if (error || !data) break

    for (const item of data) {
      const atual = ultimaMudanca.get(item.profile_id)
      if (!atual || item.updated_at > atual) {
        ultimaMudanca.set(item.profile_id, item.updated_at)
      }
    }

    if (data.length < PAGINA) break
  }

  const minisites = perfis.data
    // Perfil sem nenhum item e uma pagina vazia: mandar isso para o buscador
    // so rende pagina fraca no indice.
    .filter((p) => ultimaMudanca.has(p.id))
    .map((p) => ({
      url: `${base}/${p.username}`,
      lastModified: new Date(
        [p.updated_at, ultimaMudanca.get(p.id)!].sort().at(-1)!
      ),
    }))

  return [...raiz, ...minisites]
}
