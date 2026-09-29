// Circulo girando dos botoes que mostram que o clique pegou (Voltar,
// Configurar, menu do topo, Sair). Herda a cor do texto do botao.
export function Girando({ className = 'size-4' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" className={`${className} animate-spin`}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
