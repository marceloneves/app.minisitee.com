import { basePublica } from '@/lib/site'
import { createAdminClient, temChaveAdmin } from '@/lib/supabase/admin'

export const revalidate = 3600

// So os minisites. As paginas fixas de minisitee.com sao arquivos do outro
// repositorio e ficam em sitemap-paginas.xml; quem junta os dois e o
// sitemap.xml, um indice que tambem mora la.
//
// Nao da para usar o sitemap.ts do Next aqui: ele responde em /sitemap.xml, e
// nesse endereco o servidor entrega o arquivo do outro repositorio sem nunca
// chegar neste app.
//
// A RLS de profiles so deixa o dono ler a propria linha, entao a lista sai
// pela chave de servico. Fica no servidor: esta rota nunca vai para o cliente.
async function urls() {
  if (!temChaveAdmin()) return []

  const base = basePublica()
  const admin = createAdminClient()
  const perfis = await admin.from('profiles').select('id, username, updated_at')
  if (perfis.error || !perfis.data) return []

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

  return (
    perfis.data
      // Perfil sem nenhum item e uma pagina vazia: mandar isso para o buscador
      // so rende pagina fraca no indice.
      .filter((p) => ultimaMudanca.has(p.id))
      .map((p) => ({
        loc: `${base}/${p.username}`,
        lastmod: [p.updated_at, ultimaMudanca.get(p.id)!].sort().at(-1)!,
      }))
  )
}

export async function GET() {
  const lista = await urls()

  const corpo = lista
    .map(
      ({ loc, lastmod }) =>
        `<url><loc>${loc}</loc><lastmod>${new Date(lastmod).toISOString()}</lastmod></url>`
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${corpo}
</urlset>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  })
}
