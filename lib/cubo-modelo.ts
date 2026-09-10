// O cubo tem duas bases: uma linha por conta e uma linha por item. As duas
// carregam as dimensoes ja resolvidas em texto, entao a tabela do navegador so
// precisa agrupar — nada de recalcular faixa de preco ou mes a cada clique.
export type LinhaFato = {
  id: string
  rotulo: string
  detalhe: string
  donoId: string
  dim: Record<string, string>
  itens: number
  fotos: number
  precoCents: number | null
}

export type DadosCubo = {
  usuarios: LinhaFato[]
  itens: LinhaFato[]
  geradoEm: string
}

export type Base = 'usuarios' | 'itens'

export const VAZIO = '(não informado)'

export const DIMENSOES: Record<Base, readonly (readonly [string, string])[]> = {
  usuarios: [
    ['plano', 'Plano'],
    ['cidade', 'Cidade'],
    ['idioma', 'Idioma'],
    ['estilo', 'Estilo'],
    ['publicou', 'Publicou item'],
    ['whatsapp', 'Tem WhatsApp'],
    ['descricao', 'Tem descrição'],
    ['foto', 'Tem foto de perfil'],
    ['cadastro', 'Mês de cadastro'],
    ['acesso', 'Último acesso'],
  ],
  itens: [
    ['tipo', 'Tipo de item'],
    ['status', 'Status'],
    ['categoria', 'Categoria'],
    ['preco', 'Faixa de preço'],
    ['foto', 'Tem foto'],
    ['criacao', 'Mês de criação'],
    ['plano', 'Plano do dono'],
    ['cidade', 'Cidade do dono'],
    ['idioma', 'Idioma do dono'],
  ],
}

// casas: quantas casas decimais a medida mostra. dinheiro troca o ponto por
// virgula com duas casas.
export const MEDIDAS: Record<
  Base,
  readonly (readonly [string, string, number])[]
> = {
  usuarios: [
    ['contas', 'Contas', 0],
    ['itens', 'Itens publicados', 0],
    ['mediaItens', 'Média de itens por conta', 1],
    ['fotos', 'Fotos', 0],
  ],
  itens: [
    ['itens', 'Itens', 0],
    ['donos', 'Contas distintas', 0],
    ['fotos', 'Fotos', 0],
    ['precoMedio', 'Preço médio (R$)', 2],
  ],
}

// Cada eixo aceita varias dimensoes empilhadas, na ordem em que foram soltas.
export type Zonas = {
  linhas: string[]
  colunas: string[]
  fatias: string[]
}

export const PADRAO: Record<Base, { zonas: Zonas; medida: string }> = {
  usuarios: {
    zonas: { linhas: ['plano'], colunas: ['idioma'], fatias: [] },
    medida: 'contas',
  },
  itens: {
    zonas: { linhas: ['tipo'], colunas: ['status'], fatias: [] },
    medida: 'itens',
  },
}

// Separadores que nao aparecem em nenhum valor vindo do banco: servem para
// virar uma combinacao de dimensoes numa chave de mapa.
const NIVEL = '\u0001'
const EIXO = '\u0002'

export const chave = (valores: string[]) => valores.join(NIVEL)
export const chaveCelula = (linha: string[], coluna: string[]) =>
  `${chave(linha)}${EIXO}${chave(coluna)}`

export function valoresDe(fato: LinhaFato, dims: string[]) {
  return dims.map((d) => fato.dim[d] ?? VAZIO)
}

export function calcular(medida: string, fatos: LinhaFato[]): number | null {
  if (fatos.length === 0) return null

  switch (medida) {
    case 'contas':
      return fatos.length
    case 'itens':
      return fatos.reduce((t, f) => t + f.itens, 0)
    case 'mediaItens':
      return fatos.reduce((t, f) => t + f.itens, 0) / fatos.length
    case 'fotos':
      return fatos.reduce((t, f) => t + f.fotos, 0)
    case 'donos':
      return new Set(fatos.map((f) => f.donoId)).size
    case 'precoMedio': {
      const precos = fatos
        .map((f) => f.precoCents)
        .filter((p): p is number => p !== null)
      if (precos.length === 0) return null
      return precos.reduce((t, p) => t + p, 0) / precos.length / 100
    }
    default:
      return null
  }
}
