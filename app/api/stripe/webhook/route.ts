import { NextResponse, type NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { createStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

// Precisa do corpo cru para conferir a assinatura do Stripe.
export const dynamic = 'force-dynamic'

const ATIVOS = new Set(['active', 'trialing'])

export async function POST(request: NextRequest) {
  const segredo = process.env.STRIPE_WEBHOOK_SECRET
  if (!segredo) {
    return NextResponse.json({ erro: 'webhook não configurado' }, { status: 500 })
  }

  const assinatura = request.headers.get('stripe-signature')
  if (!assinatura) {
    return NextResponse.json({ erro: 'sem assinatura' }, { status: 400 })
  }

  const corpo = await request.text()
  const stripe = createStripe()

  let evento: Stripe.Event
  try {
    evento = stripe.webhooks.constructEvent(corpo, assinatura, segredo)
  } catch (e) {
    // Assinatura inválida: pode ser requisição forjada. Nunca processar.
    console.error('[stripe] assinatura inválida:', (e as Error).message)
    return NextResponse.json({ erro: 'assinatura inválida' }, { status: 400 })
  }

  const admin = createAdminClient()

  async function aplicar(assinaturaStripe: Stripe.Subscription) {
    const clienteId =
      typeof assinaturaStripe.customer === 'string'
        ? assinaturaStripe.customer
        : assinaturaStripe.customer.id

    const ativo = ATIVOS.has(assinaturaStripe.status)
    const item = assinaturaStripe.items.data[0]
    const fim = item?.current_period_end

    const { error } = await admin
      .from('profiles')
      .update({
        plan: ativo ? 'pro' : 'free',
        stripe_subscription_id: assinaturaStripe.id,
        subscription_status: assinaturaStripe.status,
        current_period_end: fim ? new Date(fim * 1000).toISOString() : null,
      })
      .eq('stripe_customer_id', clienteId)

    if (error) console.error('[stripe] falha ao atualizar perfil:', error.message)
  }

  try {
    switch (evento.type) {
      case 'checkout.session.completed': {
        const sessao = evento.data.object
        if (sessao.mode === 'subscription' && sessao.subscription) {
          const id =
            typeof sessao.subscription === 'string'
              ? sessao.subscription
              : sessao.subscription.id
          await aplicar(await stripe.subscriptions.retrieve(id))
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await aplicar(evento.data.object)
        break
      default:
        break
    }
  } catch (e) {
    console.error('[stripe] erro ao processar', evento.type, e)
    // 500 faz o Stripe reenviar o evento.
    return NextResponse.json({ erro: 'falha ao processar' }, { status: 500 })
  }

  return NextResponse.json({ recebido: true })
}
