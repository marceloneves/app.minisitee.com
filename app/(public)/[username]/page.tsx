import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import Link from 'next/link'
import { ItemCard } from '@/components/item-card'
import { ContagemRegressiva } from '@/components/contagem-regressiva'
import { IconeSecao } from '@/components/icone-secao'
import { RedeIcone, nomeDaRede } from '@/components/rede-icone'
import { getUserId } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import {
  DICIONARIOS,
  DIAS,
  idiomaValido,
  type Dicionario,
  type Idioma,
} from '@/lib/i18n/dicionarios'
import {
  DIAS_SEMANA,
  formatarBytes,
  linkWhatsapp,
  temaValido,
  type ItemPublico,
  type PaginaCatalogo,
} from '@/lib/types'

const buscarPagina = cache(async (username: string): Promise<PaginaCatalogo | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_catalog_page', {
    p_username: username,
  })

  if (error || !data) return null
  const pagina = data as PaginaCatalogo
  return pagina.profile ? pagina : null
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const pagina = await buscarPagina(username)

  if (!pagina?.profile) return { title: 'Página não encontrada' }

  const { profile, items } = pagina
  const nome = profile.display_name ?? profile.username
  const local = profile.city ? ` em ${profile.city}` : ''
  const titulo = profile.headline ? `${nome} — ${profile.headline}` : nome
  const descricao =
    profile.bio?.trim() ||
    `${items.length} ${items.length === 1 ? 'item disponível' : 'itens disponíveis'}${local}. Fale direto no WhatsApp.`

  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: `/${profile.username}` },
    openGraph: {
      type: 'profile',
      title: titulo,
      description: descricao,
      url: `/${profile.username}`,
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : undefined,
    },
    twitter: {
      card: 'summary',
      title: titulo,
      description: descricao,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  }
}

export default async function CatalogoPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const pagina = await buscarPagina(username)

  if (!pagina?.profile) notFound()

  const { profile, items } = pagina
  const nome = profile.display_name ?? profile.username
  const ehDono = (await getUserId()) === profile.id
  const idioma = idiomaValido(profile.locale)
  const d = DICIONARIOS[idioma]

  return (
    <div data-tema={temaValido(profile.theme)} className="min-h-dvh bg-bg text-fg">
      {ehDono && (
        <div className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2">
            <span className="text-xs text-muted">
              {d.voceEstaVendo}
            </span>
            <Link
              href="/painel"
              className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
            >
              {d.voltarPainel}
            </Link>
          </div>
        </div>
      )}
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <header className="flex flex-col items-center text-center">
          {profile.avatar_url && (
            <Image
              src={profile.avatar_url}
              alt={nome}
              width={96}
              height={96}
              priority
              sizes="96px"
              className="size-24 rounded-full object-cover"
            />
          )}

          <h1 className="mt-4 text-xl font-bold tracking-tight">{nome}</h1>

          {(profile.headline || profile.city) && (
            <p className="mt-1 text-sm text-muted">
              {[profile.headline, profile.city].filter(Boolean).join(' · ')}
            </p>
          )}

          {profile.bio && (
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
              {profile.bio}
            </p>
          )}
        </header>

        {items.length === 0 ? (
          <p className="mt-12 text-center text-sm text-muted">
{d.nenhumItem}
          </p>
        ) : (
          <div className="mt-8 space-y-4">
            {agrupar(items).map((bloco, b) =>
              bloco.tipo === 'grade' ? (
                <ul key={b} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {bloco.itens.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      username={profile.username}
                      prioridade={item.position < 2}
                      idioma={idioma}
                    />
                  ))}
                </ul>
              ) : (
                <BlocoItem
                  key={bloco.item.id}
                  item={bloco.item}
                  whatsappDoPerfil={profile.whatsapp}
                  idioma={idioma}
                  d={d}
                />
              )
            )}
          </div>
        )}

        {profile.plan === 'free' && (
          <footer className="mt-12 pb-4 text-center">
            <a
              href={`https://minisitee.com?ref=${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted underline underline-offset-4"
            >
              {d.feitoCom}
            </a>
          </footer>
        )}
      </main>
    </div>
  )
}


type Bloco =
  | { tipo: 'grade'; itens: ItemPublico[] }
  | { tipo: 'botao'; item: ItemPublico }

function agrupar(items: ItemPublico[]): Bloco[] {
  const blocos: Bloco[] = []

  for (const item of items) {
    if (item.kind !== 'produto') {
      blocos.push({ tipo: 'botao', item })
      continue
    }
    const ultimo = blocos.at(-1)
    if (ultimo?.tipo === 'grade') ultimo.itens.push(item)
    else blocos.push({ tipo: 'grade', itens: [item] })
  }

  return blocos
}

function BlocoItem({
  item,
  whatsappDoPerfil,
  idioma,
  d,
}: {
  item: ItemPublico
  whatsappDoPerfil: string | null
  idioma: Idioma
  d: Dicionario
}) {
  if (item.kind === 'redes') return <BlocoRedes item={item} />
  if (item.kind === 'faq') return <BlocoFaq item={item} />
  if (item.kind === 'galeria') return <BlocoGaleria item={item} />
  if (item.kind === 'contagem') return <BlocoContagem item={item} idioma={idioma} d={d} />
  if (item.kind === 'arquivo') return <BlocoArquivo item={item} />
  if (item.kind === 'horario') return <BlocoHorario item={item} idioma={idioma} d={d} />
  if (item.kind === 'endereco') return <BlocoEndereco item={item} d={d} />

  const destino =
    item.kind === 'whatsapp'
      ? whatsappDoPerfil
        ? linkWhatsapp(whatsappDoPerfil, item.whatsapp_message ?? 'Olá!')
        : null
      : item.kind === 'telefone'
        ? item.data?.telefone
          ? `tel:+${item.data.telefone}`
          : null
        : item.url

  if (!destino) return null

  const comIcone = item.kind === 'whatsapp' || item.kind === 'telefone'

  return (
    <a
      href={destino}
      target={item.kind === 'telefone' ? undefined : '_blank'}
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2.5 rounded-2xl border border-border bg-surface px-5 py-4 text-center text-base font-semibold"
    >
      {comIcone && <RedeIcone rede={item.kind} tamanho="size-6 shrink-0" />}
      {item.title}
    </a>
  )
}

function BlocoRedes({ item }: { item: ItemPublico }) {
  const links = (item.data?.links ?? []).filter((l) => l.url.trim())
  if (links.length === 0) return null

  return (
    <section className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4">
      <ul className="flex shrink-0 flex-wrap items-center gap-2">
        {links.map((link, i) => (
          <li key={i}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={nomeDaRede(link.rede)}
              className="block"
            >
              <RedeIcone rede={link.rede} />
            </a>
          </li>
        ))}
      </ul>
      <h2 className="flex-1 text-center text-base font-semibold">{item.title}</h2>
    </section>
  )
}

function BlocoHorario({ item, idioma, d }: { item: ItemPublico; idioma: Idioma; d: Dicionario }) {
  const dias = item.data?.dias ?? []
  if (dias.length === 0) return null

  return (
    <section className="rounded-2xl border border-border bg-surface px-5 py-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-muted">
        <IconeSecao tipo="horario" />
        {item.title}
      </h2>
      <ul className="mt-3 space-y-1.5">
        {DIAS_SEMANA.map(([chave]) => {
          const dia = dias.find((x) => x.dia === chave)
          if (!dia) return null
          return (
            <li key={chave} className="flex justify-between gap-4 text-base">
              <span>{DIAS[idioma][chave]}</span>
              <span className={dia.fechado ? 'text-muted' : 'font-medium'}>
                {dia.fechado ? d.fechado : `${dia.abre} ${d.as} ${dia.fecha}`}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function BlocoEndereco({ item, d }: { item: ItemPublico; d: Dicionario }) {
  const endereco = item.data?.endereco?.trim()
  if (!endereco) return null

  const consulta = encodeURIComponent(endereco)

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted">
          <IconeSecao tipo="endereco" />
          {item.title}
        </h2>
        <p className="mt-1 text-base">{endereco}</p>
      </div>

      <iframe
        title={`Mapa: ${endereco}`}
        src={`https://www.google.com/maps?q=${consulta}&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="aspect-video w-full border-0"
      />

      <a
        href={`https://www.google.com/maps/search/?api=1&query=${consulta}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block border-t border-border px-5 py-3 text-center text-sm font-medium"
      >
        {d.verRota}
      </a>
    </section>
  )
}


function BlocoFaq({ item }: { item: ItemPublico }) {
  const perguntas = (item.data?.perguntas ?? []).filter((q) => q.p.trim())
  if (perguntas.length === 0) return null

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface">
      <h2 className="flex items-center gap-2 px-5 pt-4 text-sm font-semibold text-muted">
        <IconeSecao tipo="faq" />
        {item.title}
      </h2>
      <ul className="mt-1">
        {perguntas.map((q, i) => (
          <li key={i} className="border-t border-border first:border-t-0">
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3.5 text-base font-medium">
                {q.p}
                <span className="shrink-0 text-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="whitespace-pre-line px-5 pb-4 text-base text-muted">{q.r}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  )
}

function BlocoGaleria({ item }: { item: ItemPublico }) {
  const fotos = item.photos ?? []
  if (fotos.length === 0) return null

  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted">
        <IconeSecao tipo="galeria" />
        {item.title}
      </h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {fotos.map((url, i) => (
          <li
            key={url}
            className="relative aspect-square overflow-hidden rounded-xl border border-border"
          >
            <Image
              src={url}
              alt=""
              fill
              sizes="(min-width: 640px) 33vw, 50vw"
              loading={i < 3 ? undefined : 'lazy'}
              className="object-cover"
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function BlocoContagem({
  item,
  idioma,
  d,
}: {
  item: ItemPublico
  idioma: Idioma
  d: Dicionario
}) {
  const alvo = item.data?.alvo
  if (!alvo) return null

  return (
    <section className="rounded-2xl border border-border bg-surface px-5 py-4 text-center">
      <h2 className="flex items-center justify-center gap-2 text-sm font-semibold text-muted">
        <IconeSecao tipo="contagem" />
        {item.title}
      </h2>
      <ContagemRegressiva
        alvo={alvo}
        textoFim={item.data?.textoFim || d.encerrado}
        idioma={idioma}
      />
    </section>
  )
}

function BlocoArquivo({ item }: { item: ItemPublico }) {
  const url = item.data?.arquivoUrl
  if (!url) return null

  const nome = item.data?.arquivoNome
  const href = nome
    ? `${url}${url.includes('?') ? '&' : '?'}download=${encodeURIComponent(nome)}`
    : url

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-5 py-4"
    >
      <span className="min-w-0">
        <span className="block text-base font-semibold">{item.title}</span>
        {item.data?.arquivoNome && (
          <span className="block truncate text-sm text-muted">
            {item.data.arquivoNome}
            {item.data.arquivoTamanho !== undefined &&
              ` · ${formatarBytes(item.data.arquivoTamanho)}`}
          </span>
        )}
      </span>
      <span aria-hidden="true" className="shrink-0 text-xl">
        ↓
      </span>
    </a>
  )
}
