import 'server-only'
import { createClient } from '@supabase/supabase-js'

// service_role ignora RLS por completo. Este arquivo tem `server-only`:
// qualquer import a partir de um componente cliente quebra o build.
export function createAdminClient() {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!chave) throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada')

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function temChaveAdmin() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
}
