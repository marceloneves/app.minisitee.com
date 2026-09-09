import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// O dominio do painel hospeda so a aplicacao. O perfil publico nao existe la:
// ele e criado uma vez, no dominio publico. Sem NEXT_PUBLIC_APP_URL definido
// nada muda, entao uma configuracao faltando nao derruba o site.
const HOST_PAINEL = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).host
  : null

// robots.txt e sitemap.xml valem nos dois dominios: no do painel eles sao a
// unica forma de dizer ao buscador para nao rastrear a area logada.
const ROTAS_DO_PAINEL = [
  '/login',
  '/nova-senha',
  '/painel',
  '/auth',
  '/api',
  '/robots.txt',
  '/sitemap.xml',
]

function soDoPainel(pathname: string) {
  return (
    pathname === '/' ||
    ROTAS_DO_PAINEL.some((r) => pathname === r || pathname.startsWith(`${r}/`))
  )
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.replace(/^www\./, '')
  if (HOST_PAINEL && host === HOST_PAINEL && !soDoPainel(request.nextUrl.pathname)) {
    return new NextResponse(null, { status: 404 })
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request: { headers: requestHeaders } })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value)
          }
        },
      },
    }
  )

  const { data } = await supabase.auth.getClaims()

  if (!data?.claims && request.nextUrl.pathname.startsWith('/painel')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''

    const redirect = NextResponse.redirect(url)
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie)
    }
    for (const [key, value] of response.headers) {
      if (key.toLowerCase() !== 'set-cookie') redirect.headers.set(key, value)
    }
    return redirect
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)',
  ],
}
