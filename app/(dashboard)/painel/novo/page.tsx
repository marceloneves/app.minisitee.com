import Link from 'next/link'
import { SeletorTipoItem } from '@/components/seletor-tipo-item'
import { getIdioma, getT } from '@/lib/i18n/servidor'

export default async function NovoItemPage() {
  const t = await getT()
  const idioma = await getIdioma()

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <Link href="/painel" className="text-sm text-muted underline underline-offset-4">
        {t('voltar')}
      </Link>

      <h1 className="mt-4 text-xl font-semibold tracking-tight">
        {t('oQueAdicionar')}
      </h1>
      <p className="mt-1 text-sm text-muted">{t('escolhaTipo')}</p>

      <SeletorTipoItem idioma={idioma} />
    </main>
  )
}
