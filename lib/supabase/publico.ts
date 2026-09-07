import { createClient } from '@supabase/supabase-js'

// Cliente sem cookies: as RPCs publicas sao security definer e nao precisam
// de sessao. Nao ler cookies e o que permite o Next cachear a pagina.
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
