import { FormularioLogin } from '@/components/formulario-login'
import { ProvedorIdioma } from '@/lib/i18n/contexto'
import { idiomaDoNavegador } from '@/lib/i18n/servidor'

export default async function LoginPage() {
  return (
    <ProvedorIdioma idioma={await idiomaDoNavegador()}>
      <FormularioLogin />
    </ProvedorIdioma>
  )
}
