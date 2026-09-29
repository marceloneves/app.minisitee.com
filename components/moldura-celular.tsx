import type { ReactNode } from 'react'

// Moldura de iPhone para o Visualizar: o dono ve o minisite na largura e na
// altura de um celular (390 x 844, a tela do iPhone 14), rolando por dentro,
// com a ilha, a barra de status e o indicador de inicio. `tela` recebe os
// atributos do estilo, para a barra de status ficar na cor do fundo.
export function MolduraCelular({
  tela,
  children,
}: {
  tela: Record<string, unknown>
  children: ReactNode
}) {
  return (
    <div className="rounded-[3.25rem] bg-zinc-900 p-3 shadow-2xl ring-1 ring-black/20">
      <div
        {...tela}
        className="relative flex h-[min(844px,calc(100dvh-9rem))] w-[390px] max-w-[calc(100vw-3.5rem)] flex-col overflow-hidden rounded-[2.5rem] bg-bg text-fg"
      >
        <div aria-hidden className="absolute left-1/2 top-2.5 z-10 h-[34px] w-[120px] -translate-x-1/2 rounded-full bg-black" />

        <div aria-hidden className="flex h-12 shrink-0 items-center justify-between px-7 pt-1 text-[15px] font-semibold">
          <span>9:41</span>
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 18 12" className="h-3 w-[18px]" fill="currentColor">
              <rect x="0" y="8" width="3" height="4" rx="1" />
              <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
              <rect x="10" y="3" width="3" height="9" rx="1" />
              <rect x="15" y="0" width="3" height="12" rx="1" />
            </svg>
            <svg viewBox="0 0 16 12" className="h-3 w-4" fill="currentColor">
              <path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.4 10.4 0 0 0 8 .4C5.2.4 2.7 1.5.8 3.3L2 4.6a8.6 8.6 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.3A6.7 6.7 0 0 0 8 4c-1.8 0-3.4.7-4.6 1.8l1.2 1.3c.9-.8 2.1-1.3 3.4-1.3Zm0 3.6c-.6 0-1.1.2-1.5.6L8 11.6l1.5-1.6c-.4-.4-.9-.6-1.5-.6Z" />
            </svg>
            <span className="flex items-center">
              <span className="flex h-3 w-6 items-center rounded-[4px] border border-current p-[1.5px] opacity-90">
                <span className="h-full w-4/5 rounded-[2px] bg-current" />
              </span>
              <span className="ml-px h-1 w-[1.5px] rounded-r bg-current opacity-60" />
            </span>
          </span>
        </div>

        <div className="sem-barra min-h-0 flex-1 overflow-y-auto">{children}</div>

        <div aria-hidden className="pointer-events-none absolute bottom-2 left-1/2 h-[5px] w-32 -translate-x-1/2 rounded-full bg-current opacity-30" />
      </div>
    </div>
  )
}
