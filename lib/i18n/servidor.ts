import { headers } from 'next/headers'
import { cache } from 'react'
import { getUserId } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { DICIONARIOS, idiomaValido, traduzir, type Dicionario, type Idioma } from '@/lib/i18n/dicionarios'

export async function idiomaDoNavegador(): Promise<Idioma> {
  const aceita = (await headers()).get('accept-language') ?? ''
  const primeiro = aceita.split(',')[0]?.trim().slice(0, 2).toLowerCase()
  return idiomaValido(primeiro)
}

export const getIdioma = cache(async (): Promise<Idioma> => {
  const userId = await getUserId()
  if (!userId) return idiomaDoNavegador()

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('locale')
    .eq('id', userId)
    .maybeSingle()

  return data?.locale ? idiomaValido(data.locale) : idiomaDoNavegador()
})

export async function getT() {
  const d: Dicionario = DICIONARIOS[await getIdioma()]
  return (chave: keyof Dicionario, vars?: Record<string, string | number>) =>
    traduzir(d, chave, vars)
}
