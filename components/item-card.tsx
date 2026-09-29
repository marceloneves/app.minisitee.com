import Image from 'next/image'
import type { ReactNode } from 'react'
import { textoDoPreco } from '@/lib/format'
import { textoDaImagem } from '@/lib/texto-imagem'
import { DICIONARIOS, type Idioma } from '@/lib/i18n/dicionarios'
import type { ItemPublico } from '@/lib/types'

export function ItemCard({
  item,
  prioridade,
  idioma,
}: {
  item: ItemPublico
  username: string
  prioridade: boolean
  idioma: Idioma
}) {
  const d = DICIONARIOS[idioma]
  return (
    <li>
      <Moldura url={item.url}>
        <div className="relative aspect-4/3 bg-border">
          {item.cover_url ? (
            <Image
              src={item.cover_url}
              alt={textoDaImagem(item.title, null)}
              title={textoDaImagem(item.title, null)}
              fill
              priority={prioridade}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-sm text-muted">
              {d.semFoto}
            </span>
          )}

          {item.status === 'reservado' && (
            <span className="absolute left-0 top-3 rounded-r-md bg-amber-400 px-3 py-1 text-xs font-semibold text-amber-950">
              {d.reservadoFaixa}
            </span>
          )}
        </div>

        <div className="p-3">
          {item.title && <h2 className="mt-0.5 line-clamp-2 text-sm font-semibold">{item.title}</h2>}
          <p className="mt-1.5 text-base font-bold">
            {textoDoPreco(item.price_cents, item.price_note) || d.sobConsulta}
          </p>
        </div>
      </Moldura>
    </li>
  )
}

// Produto nao tem pagina propria. O card so e clicavel quando o dono informou
// um link, e abre esse link; sem link, nenhum endereco e inventado.
function Moldura({ url, children }: { url: string | null; children: ReactNode }) {
  const classe = 'block overflow-hidden cartao'
  if (!url) return <div className={classe}>{children}</div>
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={classe}>
      {children}
    </a>
  )
}
