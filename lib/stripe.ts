import 'server-only'
import Stripe from 'stripe'

export function createStripe() {
  const chave = process.env.STRIPE_SECRET_KEY
  if (!chave) throw new Error('STRIPE_SECRET_KEY não configurada')

  return new Stripe(chave, { apiVersion: '2026-08-26.dahlia' })
}

export function stripeConfigurado() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID)
}
