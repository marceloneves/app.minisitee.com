export function LogoMarca({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="9" className="fill-fg" />
      <path
        d="M9 23V15.2a3.6 3.6 0 0 1 7.2 0V23M16.2 15.2a3.6 3.6 0 0 1 7.2 0V23"
        fill="none"
        strokeWidth="2.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-bg"
      />
    </svg>
  )
}

export function Logo({
  className = '',
  tamanhoMarca = 'size-8',
}: {
  className?: string
  tamanhoMarca?: string
}) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <LogoMarca className={tamanhoMarca} />
      <span className="text-lg font-semibold tracking-tight">
        minisit<span className="text-muted">ee</span>
      </span>
    </span>
  )
}
