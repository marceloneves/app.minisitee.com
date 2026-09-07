import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const getUserId = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const sub = data?.claims?.sub
  return typeof sub === 'string' ? sub : null
})
