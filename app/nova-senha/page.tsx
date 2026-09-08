import { redirect } from 'next/navigation'
import { FormularioNovaSenha } from '@/components/formulario-nova-senha'
import { getUserId } from '@/lib/auth'
import { ProvedorIdioma } from '@/lib/i18n/contexto'
import { getIdioma } from '@/lib/i18n/servidor'

export default async function NovaSenhaPage() {
  // Só chega aqui quem trocou o código do e-mail por uma sessão.
  const userId = await getUserId()
  if (!userId) redirect('/login?erro=link_invalido')

  return (
    <ProvedorIdioma idioma={await getIdioma()}>
      <FormularioNovaSenha />
    </ProvedorIdioma>
  )
}
