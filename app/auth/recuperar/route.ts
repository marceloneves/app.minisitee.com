import { NextResponse, type NextRequest } from 'next/server'
import { basePainel } from '@/lib/site'
import { createClient } from '@/lib/supabase/server'

// Route Handler porque a troca do código precisa gravar cookie de sessão,
// coisa que Server Component não faz.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const base = basePainel(origin)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login?erro=link_invalido', base))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/recuperar]', error.status, error.code, error.message)
    return NextResponse.redirect(new URL('/login?erro=link_invalido', base))
  }

  return NextResponse.redirect(new URL('/nova-senha', base))
}
