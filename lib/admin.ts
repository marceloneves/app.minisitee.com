import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

function emailsAdmin() {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export const ehAdmin = cache(async () => {
  const permitidos = emailsAdmin()
  if (permitidos.length === 0) return false

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const email = data?.claims?.email

  return typeof email === 'string' && permitidos.includes(email.toLowerCase())
})

// O cubo cruza os dados de todas as contas, entao tem dono unico — e nao a
// lista de ADMIN_EMAILS, que e outra permissao. CUBO_EMAIL sobrescreve, para
// nao precisar de deploy so para trocar de mao.
const DONO_DO_CUBO = process.env.CUBO_EMAIL ?? 'marcelomneves2@gmail.com'

export const ehDonoDoCubo = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const email = data?.claims?.email

  return (
    typeof email === 'string' &&
    email.toLowerCase() === DONO_DO_CUBO.trim().toLowerCase()
  )
})
