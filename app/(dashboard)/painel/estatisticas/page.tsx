import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserId } from '@/lib/auth'
import { TIPOS, type Dicionario, type Idioma } from '@/lib/i18n/dicionarios'
import { getIdioma, getT } from '@/lib/i18n/servidor'
import { SITE_PRODUCAO } from '@/lib/site'
import { createClient } from '@/lib/supabase/server'

// Tudo vem de uma RPC so (estatisticas_minisite), que soma no banco: a tela
// nao carrega evento por evento.
type Contagem = { nome: string; n: number }
type Estatisticas = {
  dias: number
  desde: string | null
  visitas: number
  visitas_antes: number
  visitantes: number
  visitantes_antes: number
  cliques: number
  cliques_antes: number
  por_dia: { dia: string; visitas: number }[]
  por_hora: number[]
  por_semana: number[]
  ferramentas: { id: string; titulo: string; kind: string; cliques: number }[]
  origens: Contagem[]
  aparelhos: Contagem[]
  regioes: Contagem[]
  agendamentos: number
  respostas: number
}

const PERIODOS = [7, 30, 90] as const
const LOCALE: Record<Idioma, string> = { pt: 'pt-BR', en: 'en-US', es: 'es' }

// Instagram, Google, TikTok... sao nomes proprios e nao mudam de idioma.
const NOME_ORIGEM: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  google: 'Google',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  x: 'X (Twitter)',
  linkedin: 'LinkedIn',
}

type T = Awaited<ReturnType<typeof getT>>

function nomeDaOrigem(nome: string, t: T) {
  if (NOME_ORIGEM[nome]) return NOME_ORIGEM[nome]
  const chave = `estOrigem_${nome}` as keyof Dicionario
  return nome === 'direto' || nome === 'outro' || nome === 'busca' || nome === 'qrcode'
    ? t(chave)
    : nome
}

function nomeDoAparelho(nome: string, t: T) {
  return nome === 'celular' || nome === 'computador' || nome === 'tablet'
    ? t(`estAparelho_${nome}` as keyof Dicionario)
    : nome
}

export default async function EstatisticasPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>
}) {
  const userId = await getUserId()
  if (!userId) redirect('/login')

  const t = await getT()
  const idioma = await getIdioma()
  const locale = LOCALE[idioma]
  const { p } = await searchParams
  const dias = PERIODOS.find((x) => String(x) === p) ?? 30

  const supabase = await createClient()
  const [{ data, error }, { data: perfil }] = await Promise.all([
    supabase.rpc('estatisticas_minisite', { p_dias: dias }),
    supabase.from('profiles').select('username').eq('id', userId).maybeSingle(),
  ])
  if (error) console.error('[estatisticas]', error.message)
  const e = data as Estatisticas | null

  const numero = new Intl.NumberFormat(locale)
  // Link para o dono compartilhar: sempre o endereco de producao.
  const linkRef = perfil ? `${SITE_PRODUCAO}/${perfil.username}?ref=instagram` : ''

  const chip = 'rounded-full border px-3 py-1.5 text-sm transition-colors'
  const chipAtivo = 'border-fg bg-fg font-medium text-bg'
  const chipInativo = 'border-border hover:border-muted'

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{t('estatisticas')}</h1>
        <nav className="flex gap-2">
          {PERIODOS.map((n) => (
            <Link
              key={n}
              href={`/painel/estatisticas?p=${n}`}
              className={`${chip} ${n === dias ? chipAtivo : chipInativo}`}
            >
              {t('estDias', { n })}
            </Link>
          ))}
        </nav>
      </div>

      {!e?.desde ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <p className="mx-auto max-w-sm text-sm text-muted">{t('estNenhumaVisita')}</p>
          {linkRef && (
            <p className="mx-auto mt-4 max-w-sm break-all text-xs text-muted">
              {t('estDicaRef', { link: linkRef })}
            </p>
          )}
        </div>
      ) : (
        <>
          <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Numero
              rotulo={t('estVisitas')}
              valor={numero.format(e.visitas)}
              atual={e.visitas}
              antes={e.visitas_antes}
              ajuda={t('estAntes', { n: dias, v: numero.format(e.visitas_antes) })}
            />
            <Numero
              rotulo={t('estVisitantes')}
              valor={numero.format(e.visitantes)}
              atual={e.visitantes}
              antes={e.visitantes_antes}
              ajuda={t('estVisitantesAjuda')}
            />
            <Numero
              rotulo={t('estCliques')}
              valor={numero.format(e.cliques)}
              atual={e.cliques}
              antes={e.cliques_antes}
              ajuda={t('estCliquesAjuda')}
            />
            <Numero
              rotulo={t('estTaxa')}
              valor={e.visitas ? `${numero.format(Math.round((e.cliques / e.visitas) * 100))}%` : '—'}
              ajuda={t('estTaxaAjuda')}
            />
          </section>

          <Cartao titulo={t('estPorDia')}>
            <Colunas
              valores={e.por_dia.map((x) => x.visitas)}
              dicas={e.por_dia.map(
                (x) =>
                  `${formatarDia(x.dia, locale)} · ${numero.format(x.visitas)} ${t('estVisitas').toLowerCase()}`
              )}
              rotulos={rotulosDoEixo(e.por_dia.map((x) => formatarDia(x.dia, locale)))}
              numero={numero}
              maximo={t('estMaximo')}
            />
          </Cartao>

          <div className="grid gap-4 sm:grid-cols-2">
            <Cartao titulo={t('estPorHora')}>
              <Colunas
                valores={e.por_hora}
                dicas={e.por_hora.map(
                  (n, h) => `${h}h–${h + 1}h · ${numero.format(n)} ${t('estVisitas').toLowerCase()}`
                )}
                rotulos={['0h', '6h', '12h', '18h', '24h']}
                numero={numero}
                maximo={t('estMaximo')}
              />
            </Cartao>
            <Cartao titulo={t('estPorSemana')}>
              <Linhas
                itens={ordemDaSemana(e.por_semana).map(([dow, n]) => ({
                  nome: nomeDoDia(dow, locale),
                  n,
                }))}
                numero={numero}
                semPorcentagem
                vazio={t('estNenhumDado')}
              />
            </Cartao>
          </div>

          <Cartao titulo={t('estFerramentas')}>
            <Linhas
              itens={e.ferramentas.map((f) => ({
                nome: f.titulo?.trim() && f.titulo !== 'Sem título' ? f.titulo : TIPOS[idioma][f.kind]?.nome ?? f.kind,
                detalhe: TIPOS[idioma][f.kind]?.nome,
                n: f.cliques,
              }))}
              numero={numero}
              vazio={t('estNenhumDado')}
            />
          </Cartao>

          <div className="grid gap-4 sm:grid-cols-2">
            <Cartao titulo={t('estOrigem')} nota={t('estDiretoAjuda')}>
              <Linhas
                itens={e.origens.map((o) => ({ nome: nomeDaOrigem(o.nome, t), n: o.n }))}
                numero={numero}
                vazio={t('estNenhumDado')}
              />
            </Cartao>
            <Cartao titulo={t('estAparelho')}>
              <Linhas
                itens={e.aparelhos.map((a) => ({ nome: nomeDoAparelho(a.nome, t), n: a.n }))}
                numero={numero}
                vazio={t('estNenhumDado')}
              />
            </Cartao>
          </div>

          {e.regioes.length > 0 && (
            <Cartao titulo={t('estRegiao')}>
              <Linhas itens={e.regioes} numero={numero} vazio={t('estNenhumDado')} />
            </Cartao>
          )}

          {(e.agendamentos > 0 || e.respostas > 0) && (
            <Cartao titulo={t('estResultados')}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-bold tabular-nums">{numero.format(e.agendamentos)}</p>
                  <p className="text-sm text-muted">{t('estAgendamentos')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{numero.format(e.respostas)}</p>
                  <p className="text-sm text-muted">{t('estRespostas')}</p>
                </div>
              </div>
            </Cartao>
          )}

          <footer className="mt-6 space-y-1 text-center text-xs text-muted">
            <p>
              {t('estDesde', {
                data: new Date(e.desde).toLocaleDateString(locale, { timeZone: 'America/Sao_Paulo' }),
              })}
            </p>
            {linkRef && <p className="break-all">{t('estDicaRef', { link: linkRef })}</p>}
          </footer>
        </>
      )}
    </main>
  )
}

function Cartao({
  titulo,
  nota,
  children,
}: {
  titulo: string
  nota?: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-4 rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold">{titulo}</h2>
      <div className="mt-4">{children}</div>
      {nota && <p className="mt-3 text-xs text-muted">{nota}</p>}
    </section>
  )
}

// Numero grande com a variacao em relacao ao periodo anterior. Seta e sinal
// dizem a direcao: a cor nao carrega sozinha a informacao.
function Numero({
  rotulo,
  valor,
  atual,
  antes,
  ajuda,
}: {
  rotulo: string
  valor: string
  atual?: number
  antes?: number
  ajuda: string
}) {
  const variacao =
    atual !== undefined && antes ? Math.round(((atual - antes) / antes) * 100) : null
  return (
    <div className="rounded-2xl border border-border bg-surface p-4" title={ajuda}>
      <p className="text-sm text-muted">{rotulo}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{valor}</p>
      {variacao !== null ? (
        <p className="mt-0.5 text-xs font-medium tabular-nums">
          {variacao > 0 ? '↑ +' : variacao < 0 ? '↓ ' : ''}
          {variacao}%
        </p>
      ) : (
        <p className="mt-0.5 text-xs text-muted">{ajuda}</p>
      )}
    </div>
  )
}

// Colunas finas, cantos de cima arredondados, 2px entre elas. A dica (title)
// mostra o valor de cada uma ao passar o mouse ou tocar e segurar.
function Colunas({
  valores,
  dicas,
  rotulos,
  numero,
  maximo,
}: {
  valores: number[]
  dicas: string[]
  rotulos: string[]
  numero: Intl.NumberFormat
  maximo: string
}) {
  const maior = Math.max(...valores, 0)
  return (
    <div>
      <div className="flex justify-end text-xs tabular-nums text-muted">
        {maior > 0 && maximo.replace('{n}', numero.format(maior))}
      </div>
      <div className="mt-1 flex h-32 items-end gap-[2px] border-b border-border">
        {valores.map((v, i) => (
          <div key={i} title={dicas[i]} className="group flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-[4px] bg-brand transition-opacity group-hover:opacity-70"
              style={{ height: maior ? `${Math.max((v / maior) * 100, v ? 3 : 0)}%` : 0 }}
            />
          </div>
        ))}
      </div>
      {/* Poucas legendas, espalhadas de ponta a ponta: nenhuma sai do cartao. */}
      <div className="mt-1 flex justify-between text-[11px] tabular-nums text-muted">
        {rotulos.map((r, i) => (
          <span key={i}>{r}</span>
        ))}
      </div>
    </div>
  )
}

// Lista com barra de proporcao: ranking de ferramentas, origens, aparelhos.
function Linhas({
  itens,
  numero,
  vazio,
  semPorcentagem,
}: {
  itens: { nome: string; detalhe?: string; n: number }[]
  numero: Intl.NumberFormat
  vazio: string
  semPorcentagem?: boolean
}) {
  const total = itens.reduce((s, x) => s + x.n, 0)
  const maior = Math.max(...itens.map((x) => x.n), 0)
  if (total === 0) return <p className="text-sm text-muted">{vazio}</p>

  return (
    <ul className="space-y-3">
      {itens.map((x, i) => (
        <li key={i}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">
              {x.nome}
              {x.detalhe && x.detalhe !== x.nome && (
                <span className="ml-1.5 text-xs text-muted">{x.detalhe}</span>
              )}
            </span>
            <span className="shrink-0 tabular-nums">
              {numero.format(x.n)}
              {!semPorcentagem && (
                <span className="ml-1.5 text-xs text-muted">{Math.round((x.n / total) * 100)}%</span>
              )}
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-border">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${maior ? (x.n / maior) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function formatarDia(dia: string, locale: string) {
  // A data vem sem hora: meio-dia em UTC nao vira o dia anterior no fuso.
  return new Date(`${dia}T12:00:00Z`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

// Com 30 ou 90 colunas nao cabe uma data em cada: so a primeira, a do meio e
// a ultima.
function rotulosDoEixo(datas: string[]) {
  return [datas[0], datas[Math.floor((datas.length - 1) / 2)], datas.at(-1)].filter(
    (d): d is string => Boolean(d)
  )
}

// O banco conta domingo como 0; a semana na tela comeca na segunda.
function ordemDaSemana(porSemana: number[]): [number, number][] {
  return [1, 2, 3, 4, 5, 6, 0].map((dow) => [dow, porSemana[dow] ?? 0])
}

function nomeDoDia(dow: number, locale: string) {
  // 2024-01-07 foi um domingo.
  return new Date(Date.UTC(2024, 0, 7 + dow, 12)).toLocaleDateString(locale, {
    weekday: 'long',
    timeZone: 'UTC',
  })
}
