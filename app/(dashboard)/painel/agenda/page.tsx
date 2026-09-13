import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ListaAgendamentos, type Agendamento } from '@/components/lista-agendamentos'
import { agoraNoFuso, somarDias } from '@/lib/agenda'
import { getUserId } from '@/lib/auth'
import { getT } from '@/lib/i18n/servidor'
import { createClient } from '@/lib/supabase/server'

const CAMPOS = 'id, dia, hora, nome, telefone, email, observacao, status'

export default async function AgendaPage() {
  const userId = await getUserId()
  if (!userId) redirect('/login')

  const t = await getT()
  const supabase = await createClient()

  const { data: agenda } = await supabase
    .from('items')
    .select('id, status')
    .eq('profile_id', userId)
    .eq('kind', 'agenda')
    .maybeSingle()

  if (!agenda) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <h1 className="text-xl font-semibold tracking-tight">{t('agendaTitulo')}</h1>
        <div className="mt-6 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <p className="mx-auto max-w-sm text-sm text-muted">{t('agendaSemItem')}</p>
          <Link
            href="/painel/novo"
            className="mt-6 inline-block rounded-xl bg-brand px-5 py-3 text-base font-medium text-brand-fg"
          >
            {t('agendaCriar')}
          </Link>
        </div>
      </main>
    )
  }

  const hoje = agoraNoFuso().dia
  const [{ data: proximos }, { data: anteriores }] = await Promise.all([
    supabase
      .from('agendamentos')
      .select(CAMPOS)
      .eq('item_id', agenda.id)
      .gte('dia', hoje)
      .order('dia')
      .order('hora'),
    supabase
      .from('agendamentos')
      .select(CAMPOS)
      .eq('item_id', agenda.id)
      .lt('dia', hoje)
      .gte('dia', somarDias(hoje, -60))
      .order('dia', { ascending: false })
      .order('hora')
      .limit(200),
  ])

  const noAr = agenda.status === 'ativo' || agenda.status === 'reservado'

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{t('agendaTitulo')}</h1>
        <Link
          href={`/painel/item/${agenda.id}`}
          className="rounded-xl border border-border px-4 py-2.5 text-sm"
        >
          {t('agendaConfigurar')}
        </Link>
      </div>

      {!noAr && (
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t('agendaForaDoAr')}
        </p>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-muted">{t('agendaProximos')}</h2>
        {proximos?.length ? (
          <ListaAgendamentos itens={proximos as Agendamento[]} />
        ) : (
          <p className="mt-3 rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            {t('agendaNenhum')}
          </p>
        )}
      </section>

      {anteriores?.length ? (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-semibold text-muted">
            {t('agendaAnteriores')}
          </summary>
          <ListaAgendamentos itens={anteriores as Agendamento[]} passado />
        </details>
      ) : null}
    </main>
  )
}
