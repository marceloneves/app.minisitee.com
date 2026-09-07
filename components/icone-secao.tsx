const ICONES: Record<string, { cor: string; d: string }> = {
  faq: {
    cor: '#3b82f6',
    d: 'M12 17.4v.01M9.3 9.2a2.8 2.8 0 1 1 3.6 2.7c-.6.2-.9.7-.9 1.3v.7M12 21.2a9.2 9.2 0 1 0 0-18.4 9.2 9.2 0 0 0 0 18.4z',
  },
  horario: {
    cor: '#f59e0b',
    d: 'M12 6.6V12l3.4 2M12 21.2a9.2 9.2 0 1 0 0-18.4 9.2 9.2 0 0 0 0 18.4z',
  },
  endereco: {
    cor: '#ef4444',
    d: 'M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11zM12 12.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z',
  },
  galeria: {
    cor: '#8b5cf6',
    d: 'M4 5.4h16v13.2H4zM4 15.2l4.4-4.4 4 4M14 13.4l2.2-2.2L20 15M15.4 8.6v.01',
  },
  contagem: {
    cor: '#f97316',
    d: 'M9.4 2.8h5.2M12 8v5l3 2M12 21.4a8.4 8.4 0 1 0 0-16.8 8.4 8.4 0 0 0 0 16.8z',
  },
  redes: {
    cor: '#14b8a6',
    d: 'M17 8.4a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2zM7 15.2a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2zM17 21.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2zM9.3 13.9l5.5 3.2M14.8 6.9L9.3 10.1',
  },
  link: {
    cor: '#64748b',
    d: 'M10.2 13.8a4 4 0 0 0 5.6 0l2.8-2.8a4 4 0 0 0-5.6-5.6l-1.2 1.2M13.8 10.2a4 4 0 0 0-5.6 0l-2.8 2.8a4 4 0 0 0 5.6 5.6l1.2-1.2',
  },
  produto: {
    cor: '#059669',
    d: 'M3.4 8.4 12 3.6l8.6 4.8v7.2L12 20.4l-8.6-4.8zM3.4 8.4 12 13.2l8.6-4.8M12 13.2v7.2',
  },
  arquivo: {
    cor: '#0ea5e9',
    d: 'M13.4 3.2H7a2 2 0 0 0-2 2v13.6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.8zM13.4 3.2v5.6H19M12 11.6v5.4M9.6 14.6l2.4 2.4 2.4-2.4',
  },
}

export function IconeSecao({
  tipo,
  tamanho = 'size-5',
}: {
  tipo: string
  tamanho?: string
}) {
  const icone = ICONES[tipo]
  if (!icone) return null

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${tamanho} shrink-0`}
      style={{ color: icone.cor }}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={icone.d} />
    </svg>
  )
}
