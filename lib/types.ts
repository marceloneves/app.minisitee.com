export type PerfilPublico = {
  id: string
  username: string
  display_name: string | null
  headline: string | null
  bio: string | null
  avatar_url: string | null
  // 'circulo' ou 'retangulo'; pode faltar em HTML gerado antes da coluna.
  avatar_formato?: string | null
  whatsapp: string | null
  city: string | null
  theme: string
  // Ajustes do dono por cima do estilo (lib/estilo.ts); falta em HTML gerado
  // antes da coluna.
  estilo?: unknown
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
  | 'formulario'

export type RedeSocial = { rede: string; url: string }
export type DiaHorario = { dia: string; abre: string; fecha: string; fechado: boolean }

export type Pergunta = { p: string; r: string }

export type TipoCampo =
  | 'texto'
  | 'textoLongo'
  | 'whatsapp'
  | 'email'
  | 'numero'
  | 'data'
  | 'uma'
  | 'varias'

// Uma pergunta do formulario. `opcoes` so vale para uma/varias.
export type CampoFormulario = {
  id: string
  rotulo: string
  tipo: TipoCampo
  obrigatorio: boolean
  opcoes?: string[]
}

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
  corFundo?: string
  campos?: CampoFormulario[]
  mensagemFim?: string
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
  // Pode faltar em HTML gerado antes da RPC devolver a descricao.
  description?: string | null
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
  ['formulario', 'Formulário', 'Perguntas que você cria; as respostas chegam no painel'],
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

// Toda ferramenta, produto incluido, so tem Rascunho ou Ativo.
export function statusDoTipo() {
  return STATUS_ITEM.filter(([v]) => v === 'rascunho' || v === 'ativo')
}

// Ferramentas que so a conta pro usa. No free elas nao podem ser criadas e,
// se a conta voltar para o free, saem do minisite sem apagar nada.
export const FERRAMENTAS_PRO = ['agenda', 'formulario'] as const

export function soPro(kind: string) {
  return (FERRAMENTAS_PRO as readonly string[]).includes(kind)
}

// O select `profiles(plan)` volta como objeto ou como lista, conforme o
// supabase-js entende a relacao.
export function planoDoDono(perfil: unknown) {
  const p = Array.isArray(perfil) ? perfil[0] : perfil
  return (p as { plan?: string } | null | undefined)?.plan ?? 'free'
}

// `superficie` e a cor solida da amostra e do cartao de compartilhamento.
export const ESTILOS = [
  { valor: 'light', rotulo: 'Claro', superficie: '#f7f7f8', marca: '#18181b' },
  { valor: 'areia', rotulo: 'Areia', superficie: '#fff3e2', marca: '#c2410c' },
  { valor: 'menta', rotulo: 'Menta', superficie: '#e7f7f0', marca: '#0f766e' },
  { valor: 'oceano', rotulo: 'Oceano', superficie: '#e6f0fd', marca: '#1d4ed8' },
  { valor: 'rosa', rotulo: 'Rosa', superficie: '#fdeaf1', marca: '#be185d' },
] as const

export function estiloPorValor(estilo: string) {
  return ESTILOS.find((e) => e.valor === estilo) ?? ESTILOS[0]
}

// Os estilos com foto sairam em 2026-09-29. Quem tinha escolhido um deles
// continua com o valor no banco e cai no Claro aqui.
export function temaValido(theme: string | undefined) {
  return ESTILOS.some((e) => e.valor === theme) ? (theme as string) : 'light'
}

export function linkWhatsapp(numero: string, mensagem: string) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
}
