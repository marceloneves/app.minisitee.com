export function LogoMarca({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="8.5" className="fill-fg" />
      <circle cx="8.4" cy="8.6" r="1.5" className="fill-bg" opacity="0.5" />
      <rect x="6" y="12.4" width="20" height="1.2" className="fill-bg" opacity="0.35" />
      <rect x="10" y="17.4" width="12" height="3" rx="1.5" className="fill-bg" />
      <rect x="10" y="22.4" width="7" height="3" rx="1.5" className="fill-bg" opacity="0.55" />
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
