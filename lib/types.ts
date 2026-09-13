export type PerfilPublico = {
  id: string
  username: string
  display_name: string | null
  headline: string | null
  bio: string | null
  avatar_url: string | null
  whatsapp: string | null
  city: string | null
  theme: string
  plan: string
  locale: string
}

export type TipoItem =
  | 'produto'
  | 'whatsapp'
  | 'link'
  | 'redes'
  | 'horario'
  | 'endereco'
  | 'telefone'
  | 'arquivo'
  | 'faq'
  | 'galeria'
  | 'contagem'
  | 'qrcode'
  | 'agenda'

export type RedeSocial = { rede: string; url: string }
export type DiaHorario = { dia: string; abre: string; fecha: string; fechado: boolean }

export type Pergunta = { p: string; r: string }

export type DadosItem = {
  links?: RedeSocial[]
  dias?: DiaHorario[]
  endereco?: string
  telefone?: string
  arquivoUrl?: string
  arquivoNome?: string
  arquivoTamanho?: number
  perguntas?: Pergunta[]
  alvo?: string
  textoFim?: string
  duracao?: number
  diasAFrente?: number
  antecedencia?: number
}

export const REDES = [
  ['instagram', 'Instagram'],
  ['facebook', 'Facebook'],
  ['tiktok', 'TikTok'],
  ['youtube', 'YouTube'],
  ['linkedin', 'LinkedIn'],
  ['site', 'Site'],
] as const

export const DIAS_SEMANA = [
  ['seg', 'Segunda'],
  ['ter', 'Terça'],
  ['qua', 'Quarta'],
  ['qui', 'Quinta'],
  ['sex', 'Sexta'],
  ['sab', 'Sábado'],
  ['dom', 'Domingo'],
] as const

export function horarioPadrao(): DiaHorario[] {
  return DIAS_SEMANA.map(([dia]) => ({
    dia,
    abre: '09:00',
    fecha: '18:00',
    fechado: dia === 'dom',
  }))
}

export type ItemPublico = {
  id: string
  slug: string
  title: string
  kind: TipoItem
  category: string | null
  status: string
  price_cents: number | null
  price_note: string | null
  location: string | null
  position: number
  url: string | null
  whatsapp_message: string | null
  data: DadosItem | null
  cover_url: string | null
  photos: string[] | null
}

export type PaginaCatalogo = {
  profile: PerfilPublico | null
  items: ItemPublico[]
}

export const TIPOS_ITEM = [
  ['produto', 'Produto', 'Foto, preço e página própria para compartilhar'],
  ['whatsapp', 'Botão WhatsApp', 'Abre a conversa com uma mensagem pronta'],
  ['telefone', 'Botão de ligar', 'Disca o número direto do celular'],
  ['link', 'Link', 'Botão para qualquer endereço'],
  ['redes', 'Redes sociais', 'Seus perfis em uma linha de ícones'],
  ['horario', 'Horário de funcionamento', 'Os dias e horas em que você atende'],
  ['endereco', 'Endereço com mapa', 'Onde você fica, com mapa e rota'],
  ['galeria', 'Galeria de fotos', 'Várias fotos em grade, sem preço'],
  ['faq', 'Perguntas frequentes', 'Perguntas e respostas que abrem ao tocar'],
  ['arquivo', 'Download de arquivo', 'Cardápio, tabela, PDF — o visitante baixa'],
  ['contagem', 'Contagem regressiva', 'Conta o tempo até uma data'],
  ['qrcode', 'QR code', 'Um link virando QR code para escanear'],
  ['agenda', 'Agenda', 'O cliente escolhe dia e horário para marcar'],
] as const

export function formatarBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}

export const STATUS_ITEM = [
  ['rascunho', 'Rascunho'],
  ['ativo', 'Ativo'],
  ['reservado', 'Reservado'],
  ['encerrado', 'Encerrado'],
] as const

// `superficie` e a cor solida da amostra e do cartao de compartilhamento: o
// gerador de imagem do Next nao entende url(), entao a foto nunca pode entrar
// nesse campo. `imagem` vazio marca os estilos que sao so cor. `escuro` avisa
// quem desenha fora do CSS — o cartao e a barra do navegador — que o fundo e
// escuro e o texto por cima precisa ser claro.
export const ESTILOS = [
  { valor: 'light', rotulo: 'Claro', superficie: '#f7f7f8', marca: '#18181b', imagem: '', escuro: false },
  { valor: 'areia', rotulo: 'Areia', superficie: '#fff3e2', marca: '#c2410c', imagem: '', escuro: false },
  { valor: 'menta', rotulo: 'Menta', superficie: '#e7f7f0', marca: '#0f766e', imagem: '', escuro: false },
  { valor: 'oceano', rotulo: 'Oceano', superficie: '#e6f0fd', marca: '#1d4ed8', imagem: '', escuro: false },
  { valor: 'rosa', rotulo: 'Rosa', superficie: '#fdeaf1', marca: '#be185d', imagem: '', escuro: false },

  { valor: 'lago', rotulo: 'Lago Rosa', superficie: '#f2e2e9', marca: '#0f766e', imagem: 'lago', escuro: false },
  { valor: 'espuma', rotulo: 'Espuma', superficie: '#f7e1da', marca: '#b4432f', imagem: 'espuma', escuro: false },
  { valor: 'duna', rotulo: 'Duna', superficie: '#f8e3d2', marca: '#c2410c', imagem: 'duna', escuro: false },
  { valor: 'muro', rotulo: 'Muro', superficie: '#f2f1ef', marca: '#18181b', imagem: 'muro', escuro: false },
  { valor: 'pista', rotulo: 'Pista', superficie: '#e9efe6', marca: '#15803d', imagem: 'pista', escuro: false },
  { valor: 'praia', rotulo: 'Praia Rosa', superficie: '#f9e2de', marca: '#0e7490', imagem: 'praia', escuro: false },
  { valor: 'cerejeira', rotulo: 'Cerejeira', superficie: '#fae4eb', marca: '#be185d', imagem: 'cerejeira', escuro: false },
  { valor: 'croco', rotulo: 'Croco', superficie: '#ece3f0', marca: '#7e22ce', imagem: 'croco', escuro: false },
  { valor: 'tubarao', rotulo: 'Tubarao', superficie: '#eee9df', marca: '#0f766e', imagem: 'tubarao', escuro: false },
  { valor: 'neon', rotulo: 'Neon', superficie: '#ebeaf6', marca: '#4338ca', imagem: 'neon', escuro: false },

  { valor: 'manequins', rotulo: 'Manequins', superficie: '#f1f1f3', marca: '#3f3f46', imagem: 'manequins', escuro: false },
  { valor: 'tv', rotulo: 'TV', superficie: '#eceae7', marca: '#18181b', imagem: 'tv', escuro: false },
  { valor: 'robo', rotulo: 'Robo', superficie: '#dff0f0', marca: '#0e7490', imagem: 'robo', escuro: false },

  { valor: 'lentes', rotulo: 'Lentes', superficie: '#14151a', marca: '#6ee7b7', imagem: 'lentes', escuro: true },
  { valor: 'vitrine', rotulo: 'Vitrine', superficie: '#14140f', marca: '#facc15', imagem: 'vitrine', escuro: true },
  { valor: 'pintura', rotulo: 'Pintura', superficie: '#121a24', marca: '#5eead4', imagem: 'pintura', escuro: true },
  { valor: 'rosto', rotulo: 'Rosto', superficie: '#0f2027', marca: '#f472b6', imagem: 'rosto', escuro: true },

  { valor: 'aperto', rotulo: 'Aperto', superficie: '#ebebec', marca: '#3f3f46', imagem: 'aperto', escuro: false },
  { valor: 'cidade', rotulo: 'Cidade', superficie: '#f2efe9', marca: '#b45309', imagem: 'cidade', escuro: false },
  { valor: 'ampolas', rotulo: 'Ampolas', superficie: '#e6efe8', marca: '#0f766e', imagem: 'ampolas', escuro: false },
  { valor: 'escamas', rotulo: 'Escamas', superficie: '#eeeaf5', marca: '#7c3aed', imagem: 'escamas', escuro: false },
  { valor: 'circuito', rotulo: 'Circuito', superficie: '#e3eef5', marca: '#0369a1', imagem: 'circuito', escuro: false },

  { valor: 'giro', rotulo: 'Giro', superficie: '#16182a', marca: '#fb923c', imagem: 'giro', escuro: true },
  { valor: 'ovos', rotulo: 'Ovos', superficie: '#131a26', marca: '#60a5fa', imagem: 'ovos', escuro: true },
  { valor: 'respingo', rotulo: 'Respingo', superficie: '#2a1205', marca: '#fb923c', imagem: 'respingo', escuro: true },
  { valor: 'bolas', rotulo: 'Bolas', superficie: '#100f14', marca: '#4ade80', imagem: 'bolas', escuro: true },
  { valor: 'tinta', rotulo: 'Tinta', superficie: '#0a2c4e', marca: '#a3e635', imagem: 'tinta', escuro: true },
  { valor: 'luzes', rotulo: 'Luzes', superficie: '#14161f', marca: '#fbbf24', imagem: 'luzes', escuro: true },

  { valor: 'alfinete', rotulo: 'Alfinete', superficie: '#efe6dd', marca: '#b45309', imagem: 'alfinete', escuro: false },
  { valor: 'bruma', rotulo: 'Bruma', superficie: '#dfeaf2', marca: '#0369a1', imagem: 'bruma', escuro: false },
  { valor: 'blocos', rotulo: 'Blocos', superficie: '#dbe9f2', marca: '#0e7490', imagem: 'blocos', escuro: false },
  { valor: 'esferas', rotulo: 'Esferas', superficie: '#ece6dd', marca: '#0f766e', imagem: 'esferas', escuro: false },
  { valor: 'bolhas', rotulo: 'Bolhas', superficie: '#e6e6f2', marca: '#4338ca', imagem: 'bolhas', escuro: false },
  { valor: 'arroz', rotulo: 'Arrozal', superficie: '#e7e6d2', marca: '#4d7c0f', imagem: 'arroz', escuro: false },
  { valor: 'teto', rotulo: 'Teto', superficie: '#e6e8ea', marca: '#1d4ed8', imagem: 'teto', escuro: false },

  { valor: 'fachada', rotulo: 'Fachada', superficie: '#171310', marca: '#fb923c', imagem: 'fachada', escuro: true },
  { valor: 'gotas', rotulo: 'Gotas', superficie: '#0d1626', marca: '#38bdf8', imagem: 'gotas', escuro: true },
] as const

export function estiloPorValor(estilo: string) {
  return ESTILOS.find((e) => e.valor === estilo) ?? ESTILOS[0]
}

// Caminho da foto de fundo do estilo, ou null quando ele e so cor. O `-mini` e
// a versao de 320px usada na amostra do seletor: sao quarenta e duas de uma vez
// na tela, e as grandes juntas passariam de sete megabytes.
export function imagemEstilo(estilo: string, mini = false) {
  const { imagem } = estiloPorValor(estilo)
  if (!imagem) return null
  return `/estilos/${imagem}${mini ? '-mini' : ''}.jpg`
}

export function temaValido(theme: string | undefined) {
  return ESTILOS.some((e) => e.valor === theme) ? (theme as string) : 'light'
}

export function linkWhatsapp(numero: string, mensagem: string) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
}
