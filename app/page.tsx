import Link from 'next/link'
import { LogoMarca } from '@/components/logo'

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 text-center">
      <LogoMarca className="mx-auto size-16" />
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">
        minisit<span className="text-muted">ee</span>
      </h1>
      <p className="mt-2 text-base text-muted">
        Seu minisitee: seu catálogo em um link, pronto para o Instagram.
      </p>
      <Link
        href="/login"
        className="mt-7 rounded-xl bg-brand px-4 py-3 text-base font-medium text-brand-fg"
      >
        Entrar
      </Link>
    </main>
  )
}
