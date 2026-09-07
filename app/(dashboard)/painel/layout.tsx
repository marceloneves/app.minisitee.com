import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LogoMarca } from '@/components/logo'
import { LogoutButton } from '@/components/logout-button'
import { getUserId } from '@/lib/auth'
import { ProvedorIdioma } from '@/lib/i18n/contexto'
import { getIdioma, getT } from '@/lib/i18n/servidor'
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

  const idioma = await getIdioma()
  const t = await getT()
  const link = 'rounded-lg border border-border px-3 py-1.5 text-sm'

  return (
    <ProvedorIdioma idioma={idioma}>
      <div className="min-h-dvh">
        {profile && (
          <header className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
              <Link href="/painel" className="flex min-w-0 items-center gap-2">
                <LogoMarca className="size-8 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {profile.display_name}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    minisitee.com/{profile.username}
                  </span>
                </span>
              </Link>

              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <Link href="/painel" className={link}>
                  {t('painel')}
                </Link>
                <Link href="/painel/estilo" className={link}>
                  {t('estilo')}
                </Link>
                <Link href={`/${profile.username}`} className={link}>
                  {t('verSite')}
                </Link>
                <Link href="/painel/perfil" className={link}>
                  {t('perfil')}
                </Link>
                <LogoutButton />
              </div>
            </div>
          </header>
        )}
        {children}
      </div>
    </ProvedorIdioma>
  )
}
