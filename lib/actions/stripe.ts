'use server'

import { redirect } from 'next/navigation'
import { getUserId } from '@/lib/auth'
import { createStripe, stripeConfigurado } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

function base() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'
}

async function perfilComEmail(userId: string) {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const { data: perfil } = await supabase
    .from('profiles')
    .select('username, stripe_customer_id')
    .eq('id', userId)
    .maybeSingle()

  const email = claims?.claims?.email
  return { perfil, email: typeof email === 'string' ? email : undefined }
}

export async function assinarPro() {
  if (!stripeConfigurado()) return { erro: 'stripe_indisponivel' as const }

  const userId = await getUserId()
  if (!userId) return { erro: 'Sessão expirada.' }

  const { perfil, email } = await perfilComEmail(userId)
  if (!perfil) return { erro: 'Crie seu minisitee antes de assinar.' }

  const stripe = createStripe()
  let clienteId = perfil.stripe_customer_id

  if (!clienteId) {
    const cliente = await stripe.customers.create({
      email,
      metadata: { supabase_user_id: userId },
    })
    clienteId = cliente.id

    await createAdminClient()
      .from('profiles')
      .update({ stripe_customer_id: clienteId })
      .eq('id', userId)
  }

  const sessao = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: clienteId,
    client_reference_id: userId,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${base()}/painel/perfil?assinatura=ok`,
    cancel_url: `${base()}/painel/perfil?assinatura=cancelada`,
    subscription_data: { metadata: { supabase_user_id: userId } },
    allow_promotion_codes: true,
  })

  if (!sessao.url) return { erro: 'Não foi possível abrir o checkout.' }
  redirect(sessao.url)
}

export async function abrirPortal() {
  if (!stripeConfigurado()) return { erro: 'stripe_indisponivel' as const }

  const userId = await getUserId()
  if (!userId) return { erro: 'Sessão expirada.' }

  const { perfil } = await perfilComEmail(userId)
  if (!perfil?.stripe_customer_id) return { erro: 'Nenhuma assinatura encontrada.' }

  const sessao = await createStripe().billingPortal.sessions.create({
    customer: perfil.stripe_customer_id,
    return_url: `${base()}/painel/perfil`,
  })

  redirect(sessao.url)
}
