const GLIFOS: Record<
  string,
  { nome: string; cor: string; gradiente?: boolean; glifo: React.ReactNode }
> = {
  instagram: {
    nome: 'Instagram',
    cor: '#dc2743',
    gradiente: true,
    glifo: (
      <>
        <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
        <circle cx="12" cy="12" r="4.1" />
        <circle cx="17.4" cy="6.6" r="1.25" fill="currentColor" stroke="none" />
      </>
    ),
  },
  facebook: {
    nome: 'Facebook',
    cor: '#1877F2',
    glifo: (
      <path
        d="M13.6 22v-9h2.9l.45-3.35h-3.35V7.5c0-.97.28-1.63 1.68-1.63h1.79V2.87c-.31-.04-1.38-.14-2.62-.14-2.6 0-4.38 1.59-4.38 4.5v2.42H7.15V13h2.92v9z"
        fill="currentColor"
        stroke="none"
      />
    ),
  },
  tiktok: {
    nome: 'TikTok',
    cor: '#111111',
    glifo: (
      <path
        d="M15.9 2.2c.35 2.36 1.98 3.85 4.35 4v2.9a7.2 7.2 0 0 1-3.9-1.06v5.9a5.85 5.85 0 1 1-5.05-5.8v3.02a2.86 2.86 0 1 0 2.05 2.75V2.2z"
        fill="currentColor"
        stroke="none"
      />
    ),
  },
  youtube: {
    nome: 'YouTube',
    cor: '#FF0000',
    glifo: (
      <>
        <path
          d="M22.2 8.1a2.9 2.9 0 0 0-2.03-2.05C18.37 5.55 12 5.55 12 5.55s-6.37 0-8.17.5A2.9 2.9 0 0 0 1.8 8.1 30.4 30.4 0 0 0 1.3 12c0 1.32.17 2.63.5 3.9a2.9 2.9 0 0 0 2.03 2.05c1.8.5 8.17.5 8.17.5s6.37 0 8.17-.5a2.9 2.9 0 0 0 2.03-2.05c.33-1.27.5-2.58.5-3.9a30.4 30.4 0 0 0-.5-3.9z"
          fill="currentColor"
          stroke="none"
        />
        <path d="M10.05 15.35V8.65L15.6 12z" fill="#fff" stroke="none" />
      </>
    ),
  },
  linkedin: {
    nome: 'LinkedIn',
    cor: '#0A66C2',
    glifo: (
      <>
        <rect x="2.2" y="2.2" width="19.6" height="19.6" rx="3" fill="currentColor" stroke="none" />
        <circle cx="7.1" cy="7.3" r="1.55" fill="#fff" stroke="none" />
        <path
          d="M5.85 10.1h2.5v8.05h-2.5zM10.3 10.1h2.4v1.15a2.9 2.9 0 0 1 2.6-1.35c2.1 0 3.15 1.35 3.15 3.7v4.55h-2.5v-4.2c0-1.15-.42-1.85-1.45-1.85-.92 0-1.7.62-1.7 1.95v4.1h-2.5z"
          fill="#fff"
          stroke="none"
        />
      </>
    ),
  },
  whatsapp: {
    nome: 'WhatsApp',
    cor: '#25D366',
    glifo: (
      <path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
        fill="currentColor"
        stroke="none"
      />
    ),
  },
  telefone: {
    nome: 'Telefone',
    cor: '#16a34a',
    glifo: (
      <path d="M6.6 3.5 9 8.2l-2.1 1.7a12.5 12.5 0 0 0 5.9 5.9l1.7-2.1 4.7 2.4v3.2a1.7 1.7 0 0 1-1.9 1.7C9.4 20.1 3.9 14.6 3.2 5.4A1.7 1.7 0 0 1 4.9 3.5z" />
    ),
  },
  site: {
    nome: 'Site',
    cor: '#52525b',
    glifo: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.5 3.6 5.6 3.6 9s-1.1 6.5-3.6 9c-2.5-2.5-3.6-5.6-3.6-9S9.5 5.5 12 3z" />
      </>
    ),
  },
}

export function nomeDaRede(rede: string) {
  return GLIFOS[rede]?.nome ?? rede
}

export function RedeIcone({
  rede,
  tamanho = 'size-10',
}: {
  rede: string
  tamanho?: string
}) {
  const info = GLIFOS[rede] ?? GLIFOS.site
  const traco = info.gradiente ? 'url(#gradiente-instagram)' : 'currentColor'

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={tamanho}
      style={{ color: info.cor }}
      fill="none"
      stroke={traco}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {info.gradiente && (
        <defs>
          <linearGradient id="gradiente-instagram" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="35%" stopColor="#dc2743" />
            <stop offset="70%" stopColor="#cc2366" />
            <stop offset="100%" stopColor="#bc1888" />
          </linearGradient>
        </defs>
      )}
      {info.glifo}
    </svg>
  )
}
