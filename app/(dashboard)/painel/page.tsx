import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CabecalhoPainel } from '@/components/cabecalho-painel'
import { ItemCardAdmin, type ItemResumo } from '@/components/item-card-admin'
import { getUserId } from '@/lib/auth'
import { MAX_ITENS_FREE } from '@/lib/constants'
import { getT } from '@/lib/i18n/servidor'
import { createClient } from '@/lib/supabase/server'

export default async function PainelPage() {
  const userId = await getUserId()
  if (!userId) redirect('/login')

  const t = await getT()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, plan')
    .eq('id', userId)
    .maybeSingle()

  const { data } = await supabase
    .from('items')
    .select(
      'id, slug, title, kind, status, price_cents, price_note, position, url, data, item_photos(url, position)'
    )
    .eq('profile_id', userId)
    .order('position')
    .order('created_at')

  const itens: ItemResumo[] = (data ?? []).map((it) => {
    const fotos = (it.item_photos ?? []) as { url: string; position: number }[]
    const capa = [...fotos].sort((a, b) => a.position - b.position)[0]
    return {
      id: it.id,
      slug: it.slug,
      title: it.title,
      kind: it.kind,
      status: it.status,
      url: it.url,
      data: it.data,
      price_cents: it.price_cents,
      price_note: it.price_note,
      cover_url: capa?.url ?? null,
    }
  })

  const ehFree = (profile?.plan ?? 'free') === 'free'
  const noLimite = ehFree && itens.length >= MAX_ITENS_FREE

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <CabecalhoPainel
        titulo={t('meusItens')}
        // Nova ferramenta e Ver minisitee: dois icones junto do titulo. No
        // limite do plano free a Nova ferramenta leva a tela do plano Pro.
        acao={
          <div className="flex items-center gap-2">
            <Link
              href={noLimite ? '/painel/plano-pro' : '/painel/novo'}
              aria-label={t('novoItem')}
              title={t('novoItem')}
              className="flex size-12 items-center justify-center rounded-xl bg-fg text-bg shadow-sm"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                className="size-6"
              >
                <path d="M12 5.5v13M5.5 12h13" />
              </svg>
            </Link>
            <Link
              href="/painel/visualizar"
              aria-label={t('verSite')}
              title={t('verSite')}
              className="flex size-12 items-center justify-center rounded-xl border border-fg/25 bg-bg shadow-sm"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-6"
              >
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </Link>
          </div>
        }
        subtitulo={
          ehFree ? t('limiteContador', { n: itens.length, max: MAX_ITENS_FREE }) : undefined
        }
      />

      {noLimite ? (
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t('erroLimiteFree', { max: MAX_ITENS_FREE })}{' '}
          {/* Unico caminho para a tela de mudar de plano: ela nao esta em menu. */}
          <Link href="/painel/plano-pro" className="font-semibold underline underline-offset-2">
            {t('erroLimiteLink')}
          </Link>{' '}
          {t('erroLimiteFim')}
        </p>
      ) : null}

      {itens.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <h2 className="text-base font-semibold">{t('vazioTitulo')}</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
{t('vazioTexto')}
          </p>
          <Link
            href="/painel/novo"
            className="mt-6 inline-block rounded-xl bg-brand px-5 py-3 text-base font-medium text-brand-fg"
          >
            {t('cadastrarPrimeiro')}
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {itens.map((item, i) => (
            <ItemCardAdmin
              key={item.id}
              item={item}
              username={profile?.username ?? ''}
              primeiro={i === 0}
              ultimo={i === itens.length - 1}
              ehFree={ehFree}
            />
          ))}
        </ul>
      )}
    </main>
  )
}
