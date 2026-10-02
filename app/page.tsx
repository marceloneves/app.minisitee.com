import Link from 'next/link'
import { LogoMarca } from '@/components/logo'

export default function HomePage() {
  // O rodape fica no fim da tela, fora do bloco centralizado.
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 text-center">
        <LogoMarca className="mx-auto size-16" />
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          minisit<span className="text-muted">ee</span>
        </h1>
        <p className="mt-2 text-base text-muted">
          Seu minisitee: seu catálogo em um link, pronto para o Instagram.
        </p>
        <Link
          href="/cadastro"
          className="mt-7 rounded-xl bg-brand px-4 py-3 text-base font-medium text-brand-fg"
        >
          Criar conta
        </Link>
        <Link
          href="/login"
          className="mt-3 rounded-xl border border-border px-4 py-3 text-base font-medium"
        >
          Entrar
        </Link>
      </main>
      <footer className="px-6 pb-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} PMTurbo · CNPJ 54.008.386/0001-07
      </footer>
    </div>
  )
}
