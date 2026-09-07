'use client'

import { useMemo, useState } from 'react'
import {
  LinhaUsuarioAdmin,
  type UsuarioAdmin,
} from '@/components/linha-usuario-admin'

export function ListaUsuariosAdmin({ usuarios }: { usuarios: UsuarioAdmin[] }) {
  const [busca, setBusca] = useState('')

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return usuarios

    return usuarios.filter((u) =>
      [u.username, u.email, u.displayName]
        .filter(Boolean)
        .some((campo) => campo!.toLowerCase().includes(termo))
    )
  }, [usuarios, busca])

  return (
    <>
      <div className="mt-4 flex items-center rounded-xl border border-border bg-bg focus-within:border-fg">
        <span aria-hidden="true" className="pl-4 text-muted">
          ⌕
        </span>
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por endereço, e-mail ou nome"
          aria-label="Buscar minisitee"
          className="w-full bg-transparent px-3 py-3 text-base outline-none"
        />
        {busca && (
          <button
            type="button"
            onClick={() => setBusca('')}
            aria-label="Limpar busca"
            className="px-4 text-muted"
          >
            ✕
          </button>
        )}
      </div>

      {busca && (
        <p className="mt-2 text-xs text-muted">
          {filtrados.length}{' '}
          {filtrados.length === 1 ? 'resultado' : 'resultados'} para “{busca}”
        </p>
      )}

      {filtrados.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">
          Nenhum minisitee encontrado.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {filtrados.map((u) => (
            <LinhaUsuarioAdmin key={u.id} usuario={u} />
          ))}
        </ul>
      )}
    </>
  )
}
