import type { NextRequest } from 'next/server'
import {
  assinarAcesso,
  carregarAgenda,
  gerarCodigo,
  hashCodigo,
  mesmoHash,
  normalizarEmail,
  resposta,
} from '@/lib/agenda-servidor'
import { emailConfigurado, enviarEmail, escaparHtml } from '@/lib/email'
import { DICIONARIOS, idiomaValido, traduzir } from '@/lib/i18n/dicionarios'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const VALIDADE_CODIGO_MS = 10 * 60 * 1000
const MAX_TENTATIVAS = 5
const MAX_CODIGOS_POR_EMAIL_HORA = 5
// Teto por agenda: alguem digitando e-mails a esmo nao pode gastar a cota de
// envio do Resend de todo mundo.
const MAX_CODIGOS_POR_AGENDA_HORA = 20

type Contexto = { params: Promise<{ itemId: string }> }

function haMinutos(minutos: number) {
  return new Date(Date.now() - minutos * 60 * 1000).toISOString()
}

// Sem `codigo` no corpo: pede um codigo por e-mail. Com `codigo`: confere e
// devolve o acesso a "Meus agendamentos".
export async function POST(request: NextRequest, { params }: Contexto) {
  const { itemId } = await params

  let corpo: Record<string, unknown>
  try {
    corpo = await request.json()
  } catch {
    return resposta({ erro: 'corpo inválido' }, 400)
  }

  const email = normalizarEmail(corpo.email)
  if (!email) return resposta({ erro: 'email inválido' }, 400)

  const admin = createAdminClient()
  const agenda = await carregarAgenda(admin, itemId)
  if (!agenda) return resposta({ erro: 'agenda não encontrada' }, 404)

  try {
    if (typeof corpo.codigo === 'string') {
      return await conferirCodigo(admin, agenda.id, email, corpo.codigo)
    }
    return await pedirCodigo(admin, agenda, email)
  } catch (e) {
    console.error('[agenda] falha no acesso', itemId, (e as Error).message)
    return resposta({ erro: 'falha' }, 500)
  }
}

async function pedirCodigo(
  admin: ReturnType<typeof createAdminClient>,
  agenda: { id: string; profile_id: string },
  email: string
) {
  if (!emailConfigurado()) return resposta({ erro: 'email indisponível' }, 503)

  const contar = (desde: string, porEmail: boolean) => {
    let consulta = admin
      .from('agenda_codigos')
      .select('id', { count: 'exact', head: true })
      .eq('item_id', agenda.id)
      .gte('created_at', desde)
    if (porEmail) consulta = consulta.eq('email', email)
    return consulta
  }

  const [ultimoMinuto, ultimaHora, agendaHora] = await Promise.all([
    contar(haMinutos(1), true),
    contar(haMinutos(60), true),
    contar(haMinutos(60), false),
  ])
  if (
    (ultimoMinuto.count ?? 0) > 0 ||
    (ultimaHora.count ?? 0) >= MAX_CODIGOS_POR_EMAIL_HORA ||
    (agendaHora.count ?? 0) >= MAX_CODIGOS_POR_AGENDA_HORA
  ) {
    return resposta({ erro: 'aguarde' }, 429)
  }

  // Sem agendamento com esse e-mail nao ha o que mostrar, entao nao envia.
  // A resposta e a mesma nos dois casos: a rota nao pode servir para
  // descobrir quem marcou horario com quem.
  const { count: agendamentos } = await admin
    .from('agendamentos')
    .select('id', { count: 'exact', head: true })
    .eq('item_id', agenda.id)
    .eq('email', email)
  if (!agendamentos) return resposta({ ok: true })

  const codigo = gerarCodigo()
  const { error } = await admin.from('agenda_codigos').insert({
    item_id: agenda.id,
    email,
    codigo_hash: hashCodigo(agenda.id, email, codigo),
    expira_em: new Date(Date.now() + VALIDADE_CODIGO_MS).toISOString(),
  })
  if (error) throw error

  const { data: perfil } = await admin
    .from('profiles')
    .select('username, display_name, locale')
    .eq('id', agenda.profile_id)
    .maybeSingle()

  const d = DICIONARIOS[idiomaValido(perfil?.locale)]
  const nome = perfil?.display_name || perfil?.username || 'minisitee'
  const texto = traduzir(d, 'agendaEmailTexto', { nome, codigo })
  const rodape = traduzir(d, 'agendaEmailRodape')

  const enviado = await enviarEmail({
    para: email,
    assunto: traduzir(d, 'agendaEmailAssunto', { codigo }),
    texto: `${texto}\n\n${codigo}\n\n${rodape}`,
    html: `<div style="font-family:system-ui,sans-serif;color:#18181b;max-width:480px">
<p style="font-size:16px;line-height:1.5">${escaparHtml(texto)}</p>
<p style="font-size:34px;font-weight:700;letter-spacing:8px;margin:24px 0">${codigo}</p>
<p style="font-size:13px;color:#71717a">${escaparHtml(rodape)}</p>
</div>`,
  })

  return enviado ? resposta({ ok: true }) : resposta({ erro: 'email indisponível' }, 503)
}

async function conferirCodigo(
  admin: ReturnType<typeof createAdminClient>,
  itemId: string,
  email: string,
  codigo: string
) {
  if (!/^\d{6}$/.test(codigo)) return resposta({ erro: 'inválido' }, 400)

  // Vale so o codigo mais recente: pedir outro invalida o anterior.
  const { data: registro } = await admin
    .from('agenda_codigos')
    .select('id, codigo_hash, tentativas, usado, expira_em')
    .eq('item_id', itemId)
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!registro || registro.usado || new Date(registro.expira_em).getTime() < Date.now()) {
    return resposta({ erro: 'inválido' }, 400)
  }
  if (registro.tentativas >= MAX_TENTATIVAS) return resposta({ erro: 'tentativas' }, 429)

  if (!mesmoHash(registro.codigo_hash, hashCodigo(itemId, email, codigo))) {
    await admin
      .from('agenda_codigos')
      .update({ tentativas: registro.tentativas + 1 })
      .eq('id', registro.id)
    return resposta({ erro: 'inválido' }, 400)
  }

  await admin.from('agenda_codigos').update({ usado: true }).eq('id', registro.id)
  return resposta({ token: assinarAcesso(itemId, email) })
}
