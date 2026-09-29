// Titulo das telas do painel. As opcoes (Configurar, Estilo, Ver minisitee)
// ficam no menu do topo, numa linha so com o resto (nav-painel.tsx).
export function CabecalhoPainel({
  titulo,
  subtitulo,
}: {
  titulo: string
  subtitulo?: string
}) {
  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{titulo}</h1>
      {subtitulo && <p className="mt-2 text-xs text-muted">{subtitulo}</p>}
    </div>
  )
}
