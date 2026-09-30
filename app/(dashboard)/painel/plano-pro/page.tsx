import { redirect } from 'next/navigation'
import { MudarParaPro } from '@/components/mudar-para-pro'
import { getUserId } from '@/lib/auth'
import { stripeConfigurado } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

// Tela de mudar para o Pro. Nao esta em menu nenhum nem tem link no painel:
// so se chega pelo endereco direto.
export default async function PlanoProPage() {
  const userId = await getUserId()
  if (!userId) redirect('/login')

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) redirect('/painel/comecar')

  return (
    <>
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <MudarParaPro ehPro={profile.plan === 'pro'} stripeAtivo={stripeConfigurado()} />
      </main>
    </>
  )
}
