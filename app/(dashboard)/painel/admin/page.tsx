import { notFound } from 'next/navigation'
import type { UsuarioAdmin } from '@/components/linha-usuario-admin'
import { ListaUsuariosAdmin } from '@/components/lista-usuarios-admin'
import { ehAdmin } from '@/lib/admin'
import { createAdminClient, temChaveAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function data(iso: string | null | undefined) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

export default async function AdminPage() {
  if (!(await ehAdmin())) notFound()

  if (!temChaveAdmin()) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <h1 className="text-xl font-semibold tracking-tight">Administração</h1>
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Falta a chave de serviço.</p>
          <p className="mt-2">
            Listar usuários e trocar senha exige a secret key do Supabase. Pegue em
            Settings → API Keys e coloque no <code>.env.local</code>:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-amber-100 p-3 text-xs">
            SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
          </pre>
          <p className="mt-2">
            Sem <code>NEXT_PUBLIC_</code> no nome — ela nunca pode chegar ao navegador.
            Depois reinicie o servidor.
          </p>
        </div>
      </main>
    )
  }

  const admin = createAdminClient()
  const { data: lista } = await admin.auth.admin.listUsers({ perPage: 200 })
  const { data: perfis } = await admin
    .from('profiles')
    .select('id, username, display_name, plan, locale')
  const { data: itens } = await admin.from('items').select('profile_id')

  const porPerfil = new Map((perfis ?? []).map((p) => [p.id, p]))
  const contagem = new Map<string, number>()
  for (const it of itens ?? []) {
    contagem.set(it.profile_id, (contagem.get(it.profile_id) ?? 0) + 1)
  }

  const usuarios: UsuarioAdmin[] = (lista?.users ?? []).map((u) => {
    const perfil = porPerfil.get(u.id)
    return {
      id: u.id,
      email: u.email ?? '(sem e-mail)',
      criadoEm: data(u.created_at) ?? '—',
      ultimoAcesso: data(u.last_sign_in_at),
      username: perfil?.username ?? null,
      displayName: perfil?.display_name ?? null,
      plan: perfil?.plan ?? null,
      locale: perfil?.locale ?? null,
      itens: contagem.get(u.id) ?? 0,
    }
  })

  const comPerfil = usuarios.filter((u) => u.username).length

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <h1 className="text-xl font-semibold tracking-tight">Administração</h1>
      <p className="mt-1 text-sm text-muted">
        {usuarios.length} {usuarios.length === 1 ? 'conta' : 'contas'} · {comPerfil} com
        minisitee criado
      </p>

      <ListaUsuariosAdmin usuarios={usuarios} />
    </main>
  )
}
