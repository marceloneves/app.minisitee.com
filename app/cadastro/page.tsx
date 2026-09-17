import { FormularioCadastro } from '@/components/formulario-cadastro'
import { ProvedorIdioma } from '@/lib/i18n/contexto'
import { idiomaDoNavegador } from '@/lib/i18n/servidor'

export default async function CadastroPage() {
  return (
    <ProvedorIdioma idioma={await idiomaDoNavegador()}>
      <FormularioCadastro />
    </ProvedorIdioma>
  )
}
