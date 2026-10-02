import { createHmac } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// O minisite e HTML estatico: a visita nao passa pelo app. Quem avisa e o
// rastreador da pagina (components/rastreador-visitas.tsx), por sendBeacon.
// A resposta e sempre 204: o visitante nao tem o que fazer com um erro.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ROBO =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|headless|lighthouse|pingdom|curl|wget|python|axios|node-fetch/i

// Recarregar a pagina ou voltar do WhatsApp nao conta outra visita: uma por
// visitante a cada meia hora.
const MINUTOS_POR_VISITA = 30

const nada = () => new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })

function ipDe(request: NextRequest) {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    ''
  )
}

// A mesma pessoa no mesmo dia e no mesmo minisite da o mesmo hash; muda o dia
// e muda tudo. Com segredo, nao da para descobrir o IP testando os 4 bilhoes.
function visitante(request: NextRequest, perfil: string, ua: string) {
  const dia = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const segredo = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return createHmac('sha256', segredo)
    .update(`${perfil}:${dia}:${ipDe(request)}:${ua}`)
    .digest('hex')
    .slice(0, 32)
}

function aparelho(ua: string) {
  if (/ipad|tablet/i.test(ua)) return 'tablet'
  if (/mobi|android|iphone/i.test(ua)) return 'celular'
  return 'computador'
}

// A origem vem do ?ref= / ?utm_source= do link, e sem eles do site anterior.
// O WhatsApp quase nunca manda referrer: quem chega dele cai em "direto".
function origem(referrer: string, marcador: string): { origem: string; host: string | null } {
  const m = marcador.toLowerCase()
  if (m) {
    if (/^(qr|qrcode)$/.test(m)) return { origem: 'qrcode', host: null }
    for (const nome of ['instagram', 'facebook', 'whatsapp', 'google', 'tiktok', 'youtube']) {
      if (m.includes(nome)) return { origem: nome, host: null }
    }
    if (m === 'ig') return { origem: 'instagram', host: null }
    if (m === 'fb') return { origem: 'facebook', host: null }
  }

  let host: string
  try {
    host = new URL(referrer).host.replace(/^www\./, '').toLowerCase()
  } catch {
    if (referrer.startsWith('android-app://com.whatsapp')) return { origem: 'whatsapp', host: null }
    if (referrer.startsWith('android-app://com.instagram')) return { origem: 'instagram', host: null }
    return { origem: m ? 'outro' : 'direto', host: null }
  }

  const regras: [RegExp, string][] = [
    [/(^|\.)instagram\.com$/, 'instagram'],
    [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, 'facebook'],
    [/(^|\.)(whatsapp\.com|wa\.me)$/, 'whatsapp'],
    [/(^|\.)google\.[a-z.]+$/, 'google'],
    [/(^|\.)(bing\.com|duckduckgo\.com|yahoo\.com)$/, 'busca'],
    [/(^|\.)tiktok\.com$/, 'tiktok'],
    [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube'],
    [/(^|\.)(t\.co|x\.com|twitter\.com)$/, 'x'],
    [/(^|\.)linkedin\.com$/, 'linkedin'],
  ]
  for (const [regra, nome] of regras) if (regra.test(host)) return { origem: nome, host }
  // Navegar dentro do proprio minisitee nao e origem externa.
  if (/(^|\.)minisitee\.com$/.test(host) || host.startsWith('localhost')) {
    return { origem: 'direto', host: null }
  }
  return { origem: 'outro', host }
}

// A Cloudflare manda o pais sempre; estado e cidade so com os cabecalhos de
// localizacao ligados. O IP nao e guardado em lugar nenhum.
function regiao(request: NextRequest) {
  const pais = request.headers.get('cf-ipcountry')
  const estado = request.headers.get('cf-region')
  const valido = (v: string | null) => (v && v !== 'XX' && v !== 'T1' ? v : null)
  const p = valido(pais)
  const e = valido(estado)
  if (e && p) return `${decodeURIComponent(e)}, ${p}`.slice(0, 80)
  return p
}

export async function POST(request: NextRequest) {
  const ua = request.headers.get('user-agent') ?? ''
  if (!ua || ROBO.test(ua)) return nada()

  let corpo: Record<string, unknown>
  try {
    // sendBeacon manda como texto: le o texto e interpreta.
    corpo = JSON.parse(await request.text())
  } catch {
    return nada()
  }

  const perfil = typeof corpo.p === 'string' && UUID.test(corpo.p) ? corpo.p : null
  const tipo = corpo.t === 'click' ? 'click' : corpo.t === 'page_view' ? 'page_view' : null
  const item = typeof corpo.i === 'string' && UUID.test(corpo.i) ? corpo.i : null
  if (!perfil || !tipo || (tipo === 'click' && !item)) return nada()

  const referrer = typeof corpo.r === 'string' ? corpo.r.slice(0, 500) : ''
  const marcador = typeof corpo.m === 'string' ? corpo.m.slice(0, 60) : ''
  const quem = visitante(request, perfil, ua)

  try {
    const admin = createAdminClient()

    if (tipo === 'click') {
      // Clique so conta em ferramenta deste perfil.
      const { data } = await admin
        .from('items')
        .select('id')
        .eq('id', item!)
        .eq('profile_id', perfil)
        .maybeSingle()
      if (!data) return nada()
    } else {
      const { count } = await admin
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', perfil)
        .eq('type', 'page_view')
        .eq('visitante', quem)
        .gte('created_at', new Date(Date.now() - MINUTOS_POR_VISITA * 60_000).toISOString())
      if ((count ?? 0) > 0) return nada()
    }

    const achada = origem(referrer, marcador)
    const host = achada.host
    // O navegador de dentro do Instagram e do Facebook nao manda referrer, mas
    // se identifica no user-agent.
    const nome =
      achada.origem !== 'direto'
        ? achada.origem
        : /instagram/i.test(ua)
          ? 'instagram'
          : /FBAN|FBAV|FB_IAB/.test(ua)
            ? 'facebook'
            : 'direto'
    // Perfil que nao existe falha na chave estrangeira e nao grava nada.
    const { error } = await admin.from('events').insert({
      profile_id: perfil,
      item_id: tipo === 'click' ? item : null,
      type: tipo,
      visitante: quem,
      referrer: host,
      origem: tipo === 'page_view' ? nome : null,
      aparelho: aparelho(ua),
      regiao: tipo === 'page_view' ? regiao(request) : null,
    })
    if (error && error.code !== '23503') {
      console.error('[visita] falha ao gravar', perfil, error.message)
    }
  } catch (e) {
    console.error('[visita] falha', perfil, (e as Error).message)
  }

  return nada()
}
