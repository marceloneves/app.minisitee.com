import 'server-only'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

// Os donos do minisitee: sempre admin e sempre veem o cubo, em qualquer
// servidor. Fica no codigo, e nao so no .env.local, porque o .env.local de
// producao nao vai no git e ja ficou sem ADMIN_EMAILS, sumindo Admin e Cubo.
const DONOS = ['marcelomneves@gmail.com', 'marcelomneves2@gmail.com']

// Lista de e-mails separados por virgula; vazia ou ausente nao tira ninguem
// dos DONOS.
function emailsDaVariavel(valor: string | undefined) {
  return (valor ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

const emailDoUsuario = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const email = data?.claims?.email
  return typeof email === 'string' ? email.toLowerCase() : null
})

// ADMIN_EMAILS acrescenta admins alem dos donos.
export const ehAdmin = cache(async () => {
  const email = await emailDoUsuario()
  if (!email) return false
  return [...DONOS, ...emailsDaVariavel(process.env.ADMIN_EMAILS)].includes(email)
})

// O cubo cruza os dados de todas as contas: fica com os donos e com quem
// CUBO_EMAIL acrescentar, e nao com a lista de ADMIN_EMAILS, que e outra
// permissao.
export const ehDonoDoCubo = cache(async () => {
  const email = await emailDoUsuario()
  if (!email) return false
  return [...DONOS, ...emailsDaVariavel(process.env.CUBO_EMAIL)].includes(email)
})

// Sessao do admin guardada pelo "Entrar como" (lib/actions/admin.ts): o
// refresh token dele e a conta em que entrou.
export const COOKIE_VOLTA = 'minisitee_admin_volta'

export async function lerVolta() {
  const valor = (await cookies()).get(COOKIE_VOLTA)?.value
  if (!valor) return null
  try {
    const v = JSON.parse(valor) as { r?: unknown; alvo?: unknown }
    return typeof v.r === 'string' && typeof v.alvo === 'string' ? { r: v.r, alvo: v.alvo } : null
  } catch {
    return null
  }
}
