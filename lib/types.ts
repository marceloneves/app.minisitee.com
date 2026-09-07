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

export const ESTILOS = [
  ['light', 'Claro', '#ffffff', '#18181b'],
  ['dark', 'Escuro', '#0b0b0d', '#fafafa'],
  ['areia', 'Areia', '#fffbf5', '#c2410c'],
  ['menta', 'Menta', '#f6fdfa', '#0f766e'],
  ['oceano', 'Oceano', '#f5f9ff', '#1d4ed8'],
  ['rosa', 'Rosa', '#fff7fa', '#be185d'],
] as const

export function temaValido(theme: string | undefined) {
  return ESTILOS.some(([v]) => v === theme) ? (theme as string) : 'light'
}

export function linkWhatsapp(numero: string, mensagem: string) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
}
