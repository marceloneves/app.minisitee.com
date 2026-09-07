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
