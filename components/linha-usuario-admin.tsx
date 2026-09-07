'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import {
  excluirUsuario,
  trocarPlano,
  trocarSenha,
  trocarUsername,
} from '@/lib/actions/admin'

export type UsuarioAdmin = {
  id: string
  email: string
  criadoEm: string
  ultimoAcesso: string | null
  username: string | null
  displayName: string | null
  plan: string | null
  locale: string | null
  itens: number
}

export function LinhaUsuarioAdmin({ usuario }: { usuario: UsuarioAdmin }) {
  const [pendente, iniciar] = useTransition()
  const [aberto, setAberto] = useState(false)
  const [senha, setSenha] = useState('')
  const [endereco, setEndereco] = useState(usuario.username ?? '')
  const [aviso, setAviso] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)

  function executar(acao: () => Promise<{ erro?: string } | void>, sucesso: string) {
    setAviso(null)
    iniciar(async () => {
      const r = await acao()
      setAviso(r && 'erro' in r && r.erro ? r.erro : sucesso)
    })
  }

  return (
    <li className={`rounded-2xl border border-border p-3 ${pendente ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{usuario.email}</p>
          <p className="truncate text-xs text-muted">
            {usuario.username ? (
              <Link href={`/${usuario.username}`} className="underline underline-offset-2">
                minisitee.com/{usuario.username}
              </Link>
            ) : (
              'sem perfil'
            )}
            {' · '}
            {usuario.itens} {usuario.itens === 1 ? 'item' : 'itens'}
            {usuario.locale ? ` · ${usuario.locale}` : ''}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            criado {usuario.criadoEm}
            {usuario.ultimoAcesso ? ` · último acesso ${usuario.ultimoAcesso}` : ''}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <select
            aria-label="Plano"
            value={usuario.plan ?? 'free'}
            disabled={pendente || !usuario.username}
            onChange={(e) =>
              executar(
                () => trocarPlano(usuario.id, e.target.value as 'free' | 'pro'),
                'Plano atualizado.'
              )
            }
            className="rounded-lg border border-border bg-bg px-2 py-1 text-xs disabled:opacity-40"
          >
            <option value="free">free</option>
            <option value="pro">pro</option>
          </select>

          <button
            type="button"
            onClick={() => setAberto(!aberto)}
            className="rounded-lg border border-border px-2.5 py-1 text-xs"
          >
            {aberto ? 'Fechar' : 'Gerenciar'}
          </button>
        </div>
      </div>

      {aberto && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <div>
            <span className="block text-xs font-medium text-muted">
              Endereço do minisitee
            </span>
            <div className="mt-1 flex flex-wrap gap-2">
              <input
                type="text"
                value={endereco}
                onChange={(e) =>
                  setEndereco(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
                }
                placeholder="seunome"
                disabled={!usuario.username}
                className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm outline-none focus:border-fg disabled:opacity-40"
              />
              <button
                type="button"
                disabled={
                  pendente ||
                  !usuario.username ||
                  endereco.length < 7 ||
                  endereco === usuario.username
                }
                onClick={() =>
                  executar(
                    () => trocarUsername(usuario.id, endereco),
                    'Endereço alterado.'
                  )
                }
                className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-fg disabled:opacity-40"
              >
                Trocar
              </button>
            </div>
            <p className="mt-1 text-xs text-muted">
              Os links já compartilhados com o endereço antigo param de funcionar.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Nova senha (mín. 6)"
            className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm outline-none focus:border-fg"
          />
          <button
            type="button"
            disabled={pendente || senha.length < 6}
            onClick={() =>
              executar(() => trocarSenha(usuario.id, senha), 'Senha alterada.')
            }
            className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-fg disabled:opacity-40"
          >
            Trocar
          </button>

          {confirmando ? (
            <>
              <button
                type="button"
                disabled={pendente}
                onClick={() =>
                  executar(() => excluirUsuario(usuario.id), 'Usuário excluído.')
                }
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white"
              >
                Confirmar exclusão
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="rounded-lg border border-border px-3 py-1.5 text-sm"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              className="rounded-lg px-3 py-1.5 text-sm text-red-600"
            >
              Excluir usuário
            </button>
          )}
          </div>
        </div>
      )}

      {aviso && <p className="mt-2 text-xs text-muted">{aviso}</p>}
    </li>
  )
}
