const CAMINHOS: Record<string, string> = {
  faq: 'M12 17.4v.01M9.3 9.2a2.8 2.8 0 1 1 3.6 2.7c-.6.2-.9.7-.9 1.3v.7M12 21.2a9.2 9.2 0 1 0 0-18.4 9.2 9.2 0 0 0 0 18.4z',
  horario: 'M12 6.6V12l3.4 2M12 21.2a9.2 9.2 0 1 0 0-18.4 9.2 9.2 0 0 0 0 18.4z',
  endereco: 'M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11zM12 12.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z',
  galeria: 'M4 5.4h16v13.2H4zM4 15.2l4.4-4.4 4 4M14 13.4l2.2-2.2L20 15M15.4 8.6v.01',
  contagem: 'M9.4 2.8h5.2M12 8v5l3 2M12 21.4a8.4 8.4 0 1 0 0-16.8 8.4 8.4 0 0 0 0 16.8z',
  redes: 'M17 8.4a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2zM7 15.2a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2zM17 21.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2zM9.3 13.9l5.5 3.2M14.8 6.9L9.3 10.1',
}

export function IconeSecao({ tipo }: { tipo: string }) {
  const d = CAMINHOS[tipo]
  if (!d) return null

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-5 shrink-0 text-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  )
}
