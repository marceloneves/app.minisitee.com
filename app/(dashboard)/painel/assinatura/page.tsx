import { redirect } from 'next/navigation'
import { Assinatura } from '@/components/assinatura'
import { getUserId } from '@/lib/auth'
import { stripeConfigurado } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

// A assinatura tem secao propria no topo do painel, fora do Meu perfil. E para
// ca que a Stripe devolve depois do checkout e do portal.
export default async function AssinaturaPage({
  searchParams,
}: {
  searchParams: Promise<{ assinatura?: string }>
}) {
  const { assinatura } = await searchParams
  const userId = await getUserId()
  if (!userId) redirect('/login')

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, stripe_subscription_id, current_period_end')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) redirect('/painel/comecar')

  const renovaEm = profile.current_period_end
    ? new Date(profile.current_period_end).toLocaleDateString('pt-BR')
    : null

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <Assinatura
        plano={profile.plan ?? 'free'}
        temAssinatura={Boolean(profile.stripe_subscription_id)}
        renovaEm={renovaEm}
        stripeAtivo={stripeConfigurado()}
        retorno={assinatura === 'ok' ? 'ok' : assinatura === 'cancelada' ? 'cancelada' : null}
      />
    </main>
  )
}
