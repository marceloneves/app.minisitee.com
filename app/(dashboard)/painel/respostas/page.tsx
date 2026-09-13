import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ListaRespostas, type Resposta } from '@/components/lista-respostas'
import { getUserId } from '@/lib/auth'
import { TIPOS } from '@/lib/i18n/dicionarios'
import { getIdioma, getT } from '@/lib/i18n/servidor'
import { createClient } from '@/lib/supabase/server'

export default async function RespostasPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>
}) {
  const userId = await getUserId()
  if (!userId) redirect('/login')

  const t = await getT()
  const idioma = await getIdioma()
  const supabase = await createClient()

  const [{ data: perfil }, { data: formularios }] = await Promise.all([
    supabase.from('profiles').select('plan').eq('id', userId).maybeSingle(),
    supabase
      .from('items')
      .select('id, title')
      .eq('profile_id', userId)
      .eq('kind', 'formulario')
      .order('position'),
  ])

  if (!formularios?.length) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <h1 className="text-xl font-semibold tracking-tight">{t('respostasTitulo')}</h1>
        <div className="mt-6 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <p className="mx-auto max-w-sm text-sm text-muted">{t('respostasSemFormulario')}</p>
          <Link
            href="/painel/novo"
            className="mt-6 inline-block rounded-xl bg-brand px-5 py-3 text-base font-medium text-brand-fg"
          >
            {t('respostasCriar')}
          </Link>
        </div>
      </main>
    )
  }

  const { f } = await searchParams
  const filtro = formularios.find((x) => x.id === f)?.id ?? null

  let consulta = supabase
    .from('respostas_formulario')
    .select('id, item_id, respostas, lida, created_at')
    .eq('profile_id', userId)
    .order('created_at', { ascending: false })
    .limit(300)
  if (filtro) consulta = consulta.eq('item_id', filtro)
  const { data: respostas } = await consulta

  const titulos = Object.fromEntries(formularios.map((x) => [x.id, x.title as string]))
  const ehFree = (perfil?.plan ?? 'free') === 'free'
  const paraEditar = filtro ?? (formularios.length === 1 ? formularios[0].id : null)

  const chip = 'rounded-full border px-3 py-1.5 text-sm transition-colors'
  const chipAtivo = 'border-fg bg-fg font-medium text-bg'
  const chipInativo = 'border-border hover:border-muted'

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{t('respostasTitulo')}</h1>
        {paraEditar && (
          <Link
            href={`/painel/item/${paraEditar}`}
            className="rounded-xl border border-border px-4 py-2.5 text-sm"
          >
            {t('respostasEditar')}
          </Link>
        )}
      </div>

      {ehFree && (
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t('ferramentaProAviso', { nome: TIPOS[idioma].formulario.nome })}
        </p>
      )}

      {formularios.length > 1 && (
        <nav className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/painel/respostas"
            className={`${chip} ${filtro ? chipInativo : chipAtivo}`}
          >
            {t('respostasTodos')}
          </Link>
          {formularios.map((x) => (
            <Link
              key={x.id}
              href={`/painel/respostas?f=${x.id}`}
              className={`${chip} ${filtro === x.id ? chipAtivo : chipInativo}`}
            >
              {x.title}
            </Link>
          ))}
        </nav>
      )}

      {respostas?.length ? (
        <ListaRespostas
          itens={respostas as Resposta[]}
          titulos={titulos}
          mostrarTitulo={!filtro && formularios.length > 1}
        />
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          {t('respostasNenhuma')}
        </p>
      )}
    </main>
  )
}
