import { createHash } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { camposDoFormulario, validarRespostas } from '@/lib/formulario'
import { createAdminClient } from '@/lib/supabase/admin'
import { planoDoDono } from '@/lib/types'

export const dynamic = 'force-dynamic'

// Envios do mesmo visitante no mesmo formulario em 10 minutos, e de todo mundo
// no formulario em uma hora. O segundo segura robo que troca de IP.
const MAX_POR_VISITANTE = 5
const MAX_POR_FORMULARIO_HORA = 60

type Contexto = { params: Promise<{ itemId: string }> }

function resposta(corpo: object, status = 200) {
  return NextResponse.json(corpo, { status, headers: { 'Cache-Control': 'no-store' } })
}

function haMinutos(minutos: number) {
  return new Date(Date.now() - minutos * 60 * 1000).toISOString()
}

// So o hash do IP junto com o formulario: da para contar envios seguidos sem
// guardar o endereco de ninguem. Sem IP nenhum, fica valendo so o teto por hora.
function visitante(request: NextRequest, itemId: string) {
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip')
  return ip ? createHash('sha256').update(`${itemId}:${ip}`).digest('hex') : null
}

export async function POST(request: NextRequest, { params }: Contexto) {
  const { itemId } = await params
  if (!/^[0-9a-f-]{36}$/i.test(itemId)) {
    return resposta({ erro: 'formulário não encontrado' }, 404)
  }

  let corpo: Record<string, unknown>
  try {
    corpo = await request.json()
  } catch {
    return resposta({ erro: 'corpo inválido' }, 400)
  }

  // Campo escondido que so robo preenche: responde como se tivesse gravado.
  if (typeof corpo.site === 'string' && corpo.site.trim()) {
    return resposta({ ok: true }, 201)
  }

  // O visitante nao tem sessao, entao a leitura e com a chave de servico. Por
  // isso a rota confere tudo sozinha: so formulario ativo de conta pro recebe.
  const admin = createAdminClient()
  const { data: item } = await admin
    .from('items')
    .select('id, profile_id, kind, status, data, profiles(plan)')
    .eq('id', itemId)
    .maybeSingle()

  if (
    !item ||
    item.kind !== 'formulario' ||
    item.status !== 'ativo' ||
    planoDoDono(item.profiles) === 'free'
  ) {
    return resposta({ erro: 'formulário não encontrado' }, 404)
  }

  const campos = camposDoFormulario(item.data)
  if (campos.length === 0) return resposta({ erro: 'formulário não encontrado' }, 404)

  const validacao = validarRespostas(campos, corpo.valores)
  if (!validacao.ok) {
    return resposta(
      { erro: 'dados inválidos', campo: validacao.campo, motivo: validacao.motivo },
      400
    )
  }

  const ipHash = visitante(request, item.id)

  try {
    if (ipHash) {
      const { count } = await admin
        .from('respostas_formulario')
        .select('id', { count: 'exact', head: true })
        .eq('item_id', item.id)
        .eq('ip_hash', ipHash)
        .gte('created_at', haMinutos(10))
      if ((count ?? 0) >= MAX_POR_VISITANTE) return resposta({ erro: 'limite' }, 429)
    }

    const { count: naHora } = await admin
      .from('respostas_formulario')
      .select('id', { count: 'exact', head: true })
      .eq('item_id', item.id)
      .gte('created_at', haMinutos(60))
    if ((naHora ?? 0) >= MAX_POR_FORMULARIO_HORA) return resposta({ erro: 'limite' }, 429)

    const { error } = await admin.from('respostas_formulario').insert({
      item_id: item.id,
      profile_id: item.profile_id,
      respostas: validacao.respostas,
      ip_hash: ipHash,
    })
    if (error) throw error

    return resposta({ ok: true }, 201)
  } catch (e) {
    console.error('[formulario] falha ao gravar', itemId, (e as Error).message)
    return resposta({ erro: 'falha' }, 500)
  }
}
