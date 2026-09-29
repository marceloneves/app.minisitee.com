// Titulo das telas do painel. As opcoes (Configurar, Estilo, Ver minisitee)
// ficam no menu do topo, numa linha so com o resto (nav-painel.tsx).
export function CabecalhoPainel({
  titulo,
  subtitulo,
  acao,
}: {
  titulo: string
  subtitulo?: string
  // Botao ao lado do titulo, como o Ver minisitee na lista de ferramentas.
  acao?: React.ReactNode
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{titulo}</h1>
        {acao}
      </div>
      {subtitulo && <p className="mt-2 text-xs text-muted">{subtitulo}</p>}
    </div>
  )
}
