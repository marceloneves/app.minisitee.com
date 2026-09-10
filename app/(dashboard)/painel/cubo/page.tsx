import { notFound } from 'next/navigation'
import { CuboOlap } from '@/components/cubo-olap'
import { ehDonoDoCubo } from '@/lib/admin'
import { montarCubo } from '@/lib/cubo'
import { temChaveAdmin } from '@/lib/supabase/admin'

// Numero de conta muda a cada cadastro: cache aqui so mostraria o passado.
export const dynamic = 'force-dynamic'

export default async function CuboPage() {
  if (!(await ehDonoDoCubo())) notFound()

  if (!temChaveAdmin()) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        <h1 className="text-xl font-semibold tracking-tight">Cubo</h1>
        <p className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Falta a <code>SUPABASE_SERVICE_ROLE_KEY</code> no ambiente. Sem ela não dá
          para ler os dados de todas as contas.
        </p>
      </main>
    )
  }

  const dados = await montarCubo()

  const hora = new Date(dados.geradoEm).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <h1 className="text-xl font-semibold tracking-tight">Cubo</h1>
      <p className="mt-1 text-sm text-muted">
        {dados.usuarios.length} {dados.usuarios.length === 1 ? 'conta' : 'contas'} ·{' '}
        {dados.itens.length} {dados.itens.length === 1 ? 'item' : 'itens'} · lido às{' '}
        {hora}
      </p>

      <div className="mt-6">
        <CuboOlap dados={dados} />
      </div>
    </main>
  )
}
