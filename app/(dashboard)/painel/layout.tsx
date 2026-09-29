import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { EnderecoCopiavel } from '@/components/endereco-copiavel'
import { LogoMarca } from '@/components/logo'
import { NavPainel } from '@/components/nav-painel'
import { ehAdmin, ehDonoDoCubo, lerVolta } from '@/lib/admin'
import { sairDoAmbiente } from '@/lib/actions/admin'
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
  // Configurando uma ferramenta, os botoes do menu somem (o logotipo e o nome
  // ficam): para sair dali, so o Voltar, na barra do proprio editor.
  const noEditor = pathname.startsWith('/painel/item/')

  if (!profile && !naOnboarding) redirect('/painel/comecar')
  if (profile && naOnboarding) redirect('/painel')

  const admin = await ehAdmin()
  const cubo = await ehDonoDoCubo()
  // Admin dentro da conta de outra pessoa pelo "Entrar como". Confere a conta
  // para um cookie que sobrou nao mostrar a faixa na conta errada.
  const volta = await lerVolta()
  const noAmbienteDeOutro = volta?.alvo === userId

  // As secoes Agenda e Respostas so aparecem para quem tem a ferramenta.
  const [{ count: agendas }, { count: formularios }] = await Promise.all([
    supabase
      .from('items')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', userId)
      .eq('kind', 'agenda'),
    supabase
      .from('items')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', userId)
      .eq('kind', 'formulario'),
  ])
  const idioma = await getIdioma()

  return (
    <ProvedorIdioma idioma={idioma}>
      <div className="min-h-dvh">
        {noAmbienteDeOutro && (
          <form
            action={sairDoAmbiente}
            className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-400 px-4 py-2 text-sm text-amber-950"
          >
            <span>
              Você está no ambiente de{' '}
              <strong>{profile?.display_name || profile?.username || 'outra conta'}</strong>.
              Tudo o que mudar aqui vale para a conta dessa pessoa.
            </span>
            <button
              type="submit"
              className="rounded-lg bg-amber-950 px-3 py-1 text-xs font-semibold text-amber-50"
            >
              Voltar para minha conta
            </button>
          </form>
        )}
        {profile && (
          <header className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur">
            <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3">
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

              {!noEditor && (
                <NavPainel
                  admin={admin}
                  cubo={cubo}
                  agenda={(agendas ?? 0) > 0}
                  respostas={(formularios ?? 0) > 0}
                />
              )}
            </div>
          </header>
        )}
        {children}
      </div>
    </ProvedorIdioma>
  )
}
