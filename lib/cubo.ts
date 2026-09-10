import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { ROTULO_ESTILO } from '@/lib/i18n/dicionarios'
import { VAZIO, type DadosCubo, type LinhaFato } from '@/lib/cubo-modelo'
import { TIPOS_ITEM, STATUS_ITEM } from '@/lib/types'

// O PostgREST devolve no maximo mil linhas por chamada. O cubo conta tudo, e
// contar so as mil primeiras seria pior do que nao contar.
//
// Erro aqui explode de proposito: um cubo que mostra zero por causa de uma
// consulta quebrada e pior do que uma pagina com erro na cara.
async function todas<T>(
  nome: string,
  buscar: (
    de: number,
    ate: number
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
) {
  const PAGINA = 1000
  const tudo: T[] = []

  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await buscar(de, de + PAGINA - 1)
    if (error) throw new Error(`Não consegui ler ${nome}: ${error.message}`)
    if (!data || data.length === 0) break
    tudo.push(...data)
    if (data.length < PAGINA) break
  }

  return tudo
}

function mes(iso: string | null | undefined) {
  if (!iso) return VAZIO
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const sim = (v: unknown) => (v ? 'Sim' : 'Não')

function desdeOAcesso(iso: string | null | undefined) {
  if (!iso) return 'Nunca entrou'
  const dias = (Date.now() - new Date(iso).getTime()) / 86_400_000
  if (dias < 1) return 'Hoje'
  if (dias < 7) return 'Últimos 7 dias'
  if (dias < 30) return 'Últimos 30 dias'
  return 'Mais de 30 dias'
}

function faixaDePreco(cents: number | null) {
  if (cents === null) return 'Sem preço'
  const reais = cents / 100
  if (reais < 50) return 'Até R$ 50'
  if (reais < 200) return 'R$ 50 a 200'
  if (reais < 1000) return 'R$ 200 a 1.000'
  return 'Acima de R$ 1.000'
}

const rotuloTipo = (kind: string) =>
  TIPOS_ITEM.find(([v]) => v === kind)?.[1] ?? kind
const rotuloStatus = (status: string) =>
  STATUS_ITEM.find(([v]) => v === status)?.[1] ?? status

const IDIOMAS: Record<string, string> = {
  pt: 'Português',
  en: 'Inglês',
  es: 'Espanhol',
}

export async function montarCubo(): Promise<DadosCubo> {
  const admin = createAdminClient()

  const [contas, perfis, itens, fotos] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    todas<{
      id: string
      username: string
      display_name: string | null
      plan: string
      city: string | null
      locale: string
      theme: string
      whatsapp: string | null
      bio: string | null
      avatar_url: string | null
      created_at: string
    }>('perfis', (de, ate) =>
      admin
        .from('profiles')
        .select(
          'id, username, display_name, plan, city, locale, theme, whatsapp, bio, avatar_url, created_at'
        )
        .range(de, ate)
    ),
    todas<{
      id: string
      profile_id: string
      title: string
      kind: string
      status: string
      category: string | null
      price_cents: number | null
      created_at: string
    }>('itens', (de, ate) =>
      admin
        .from('items')
        .select(
          'id, profile_id, title, kind, status, category, price_cents, created_at'
        )
        .range(de, ate)
    ),
    todas<{ item_id: string }>('fotos', (de, ate) =>
      admin.from('item_photos').select('item_id').range(de, ate)
    ),
  ])

  const fotosPorItem = new Map<string, number>()
  for (const { item_id } of fotos) {
    fotosPorItem.set(item_id, (fotosPorItem.get(item_id) ?? 0) + 1)
  }

  const itensPorPerfil = new Map<string, number>()
  const fotosPorPerfil = new Map<string, number>()
  for (const item of itens) {
    itensPorPerfil.set(item.profile_id, (itensPorPerfil.get(item.profile_id) ?? 0) + 1)
    fotosPorPerfil.set(
      item.profile_id,
      (fotosPorPerfil.get(item.profile_id) ?? 0) + (fotosPorItem.get(item.id) ?? 0)
    )
  }

  // A conta existe no auth; o perfil so nasce quando a pessoa escolhe o
  // endereco. Quem parou antes disso conta como conta sem minisite, e some do
  // cubo se a base for so a tabela de perfis.
  const acessoPorId = new Map<string, string | null>()
  const emailPorId = new Map<string, string>()
  const cadastroPorId = new Map<string, string>()
  for (const u of contas.data?.users ?? []) {
    acessoPorId.set(u.id, u.last_sign_in_at ?? null)
    emailPorId.set(u.id, u.email ?? VAZIO)
    cadastroPorId.set(u.id, u.created_at)
  }

  const perfilPorId = new Map(perfis.map((p) => [p.id, p]))

  const linhasUsuario: LinhaFato[] = (contas.data?.users ?? []).map((u) => {
    const p = perfilPorId.get(u.id)
    return {
      id: u.id,
      rotulo: p?.display_name || p?.username || (u.email ?? VAZIO),
      detalhe: [u.email, p?.username && `/${p.username}`].filter(Boolean).join(' · '),
      donoId: u.id,
      itens: itensPorPerfil.get(u.id) ?? 0,
      fotos: fotosPorPerfil.get(u.id) ?? 0,
      precoCents: null,
      dim: {
        plano: p ? (p.plan === 'pro' ? 'Pro' : 'Free') : 'Sem minisitee',
        cidade: p?.city?.trim() || VAZIO,
        idioma: p ? (IDIOMAS[p.locale] ?? p.locale) : VAZIO,
        estilo: p ? (ROTULO_ESTILO.pt[p.theme] ?? p.theme) : VAZIO,
        publicou: sim(itensPorPerfil.get(u.id)),
        whatsapp: sim(p?.whatsapp),
        descricao: sim(p?.bio?.trim()),
        foto: sim(p?.avatar_url),
        cadastro: mes(cadastroPorId.get(u.id)),
        acesso: desdeOAcesso(acessoPorId.get(u.id)),
      },
    }
  })

  const linhasItem: LinhaFato[] = itens.map((item) => {
    const p = perfilPorId.get(item.profile_id)
    const fotosDoItem = fotosPorItem.get(item.id) ?? 0

    return {
      id: item.id,
      rotulo: item.title,
      detalhe: [p?.username && `/${p.username}`, rotuloTipo(item.kind)]
        .filter(Boolean)
        .join(' · '),
      donoId: item.profile_id,
      itens: 1,
      fotos: fotosDoItem,
      precoCents: item.price_cents,
      dim: {
        tipo: rotuloTipo(item.kind),
        status: rotuloStatus(item.status),
        categoria: item.category?.trim() || VAZIO,
        preco: faixaDePreco(item.price_cents),
        foto: sim(fotosDoItem),
        criacao: mes(item.created_at),
        plano: p?.plan === 'pro' ? 'Pro' : 'Free',
        cidade: p?.city?.trim() || VAZIO,
        idioma: p ? (IDIOMAS[p.locale] ?? p.locale) : VAZIO,
      },
    }
  })

  return {
    usuarios: linhasUsuario,
    itens: linhasItem,
    geradoEm: new Date().toISOString(),
  }
}
