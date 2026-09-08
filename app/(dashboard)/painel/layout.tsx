import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { EnderecoCopiavel } from '@/components/endereco-copiavel'
import { LogoMarca } from '@/components/logo'
import { NavPainel } from '@/components/nav-painel'
import { ehAdmin } from '@/lib/admin'
import { getUserId } from '@/lib/auth'
import { ProvedorIdioma } from '@/lib/i18n/contexto'
import { getIdioma } from '@/lib/i18n/servidor'
import { createClient } from '@/lib/supabase/server'

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userId = await getUserId()
  if (!userId) redirect('/login')

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .eq('id', userId)
    .maybeSingle()

  const pathname = (await headers()).get('x-pathname') ?? ''
  const naOnboarding = pathname.startsWith('/painel/comecar')

  if (!profile && !naOnboarding) redirect('/painel/comecar')
  if (profile && naOnboarding) redirect('/painel')

  const admin = await ehAdmin()
  const idioma = await getIdioma()

  return (
    <ProvedorIdioma idioma={idioma}>
      <div className="min-h-dvh">
        {profile && (
          <header className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur">
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <Link href="/painel" className="shrink-0">
                  <LogoMarca className="size-8" />
                </Link>
                <span className="min-w-0">
                  <Link
                    href="/painel"
                    className="block truncate text-sm font-semibold"
                  >
                    {profile.display_name}
                  </Link>
                  <EnderecoCopiavel username={profile.username} />
                </span>
              </div>

              <NavPainel admin={admin} />
            </div>
          </header>
        )}
        {children}
      </div>
    </ProvedorIdioma>
  )
}
