import { redirect } from 'next/navigation'
import { EditorPerfil, type PerfilForm } from '@/components/editor-perfil'
import { getUserId } from '@/lib/auth'
import { getT } from '@/lib/i18n/servidor'
import { stripeConfigurado } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ assinatura?: string }>
}) {
  const { assinatura } = await searchParams
  const userId = await getUserId()
  if (!userId) redirect('/login')

  const t = await getT()
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, headline, bio, city, whatsapp, locale, plan, avatar_url, stripe_subscription_id, current_period_end')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) redirect('/painel/comecar')

  const inicial: PerfilForm = {
    username: profile.username,
    avatarUrl: profile.avatar_url ?? null,
    displayName: profile.display_name ?? '',
    headline: profile.headline ?? '',
    bio: profile.bio ?? '',
    city: profile.city ?? '',
    whatsapp: profile.whatsapp ?? '55',
    locale: profile.locale ?? 'pt',
    plan: profile.plan ?? 'free',
  }

  const renovaEm = profile.current_period_end
    ? new Date(profile.current_period_end).toLocaleDateString('pt-BR')
    : null

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">{t('meuPerfil')}</h1>
      <EditorPerfil
        inicial={inicial}
        assinatura={{
          temAssinatura: Boolean(profile.stripe_subscription_id),
          renovaEm,
          stripeAtivo: stripeConfigurado(),
          retorno:
            assinatura === 'ok'
              ? 'ok'
              : assinatura === 'cancelada'
                ? 'cancelada'
                : null,
        }}
      />
    </main>
  )
}
