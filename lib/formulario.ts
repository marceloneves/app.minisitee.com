import type { CampoFormulario, DadosItem, TipoCampo } from '@/lib/types'

// Regras do Formulario usadas no editor, na pagina publica e na rota que grava:
// o navegador e o servidor conferem as respostas do mesmo jeito.

export const TIPOS_CAMPO: TipoCampo[] = [
  'texto',
  'textoLongo',
  'whatsapp',
  'email',
  'numero',
  'data',
  'uma',
  'varias',
]

export const MAX_CAMPOS = 20
const MAX_OPCOES = 20
const MAX_ROTULO = 120

// Tamanho maximo de cada resposta, em caracteres.
export const LIMITE_RESPOSTA: Record<TipoCampo, number> = {
  texto: 200,
  textoLongo: 2000,
  whatsapp: 20,
  email: 254,
  numero: 30,
  data: 10,
  uma: 80,
  varias: 80,
}

export type ValorCampo = string | string[]
export type RespostaCampo = { rotulo: string; tipo: TipoCampo; valor: ValorCampo }

export type Validacao =
  | { ok: true; respostas: RespostaCampo[] }
  | { ok: false; campo: string | null; motivo: 'obrigatorio' | 'invalido' | 'vazio' }

export function novoIdCampo() {
  return Math.random().toString(36).slice(2, 10)
}

function opcoesLimpas(opcoes: unknown) {
  if (!Array.isArray(opcoes)) return []
  const vistas = new Set<string>()
  for (const o of opcoes) {
    const texto = typeof o === 'string' ? o.trim().slice(0, LIMITE_RESPOSTA.uma) : ''
    if (texto) vistas.add(texto)
  }
  return [...vistas].slice(0, MAX_OPCOES)
}

// O que o dono gravou vira a lista que o visitante ve: pergunta sem texto, ou
// de escolha sem nenhuma opcao, fica de fora em vez de aparecer quebrada.
export function camposDoFormulario(dados: DadosItem | null | undefined): CampoFormulario[] {
  const lista = Array.isArray(dados?.campos) ? dados.campos : []
  const campos: CampoFormulario[] = []
  const ids = new Set<string>()

  for (const c of lista) {
    if (!c || typeof c.id !== 'string' || !c.id || ids.has(c.id)) continue
    if (!TIPOS_CAMPO.includes(c.tipo)) continue
    const rotulo = typeof c.rotulo === 'string' ? c.rotulo.trim().slice(0, MAX_ROTULO) : ''
    if (!rotulo) continue

    const campo: CampoFormulario = {
      id: c.id,
      rotulo,
      tipo: c.tipo,
      obrigatorio: Boolean(c.obrigatorio),
    }
    if (c.tipo === 'uma' || c.tipo === 'varias') {
      campo.opcoes = opcoesLimpas(c.opcoes)
      if (campo.opcoes.length === 0) continue
    }

    ids.add(c.id)
    campos.push(campo)
    if (campos.length === MAX_CAMPOS) break
  }

  return campos
}

export function normalizarWhatsapp(valor: string) {
  const digitos = valor.replace(/\D/g, '')
  // Sem codigo de pais vale o Brasil, como na agenda.
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`
  return digitos.length >= 12 && digitos.length <= 15 ? digitos : null
}

function dataValida(valor: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
  const data = new Date(`${valor}T00:00:00Z`)
  // 2026-02-31 vira 3 de marco no Date: comparar de volta pega a data inventada.
  return !Number.isNaN(data.getTime()) && data.toISOString().startsWith(valor)
}

export function validarRespostas(campos: CampoFormulario[], valores: unknown): Validacao {
  const entrada =
    valores && typeof valores === 'object' ? (valores as Record<string, unknown>) : {}
  const respostas: RespostaCampo[] = []

  for (const c of campos) {
    const bruto = entrada[c.id]
    const erro = (motivo: 'obrigatorio' | 'invalido'): Validacao => ({
      ok: false,
      campo: c.id,
      motivo,
    })

    if (c.tipo === 'varias') {
      const marcadas = Array.isArray(bruto)
        ? [...new Set(bruto.filter((v): v is string => typeof v === 'string'))]
        : []
      if (marcadas.length === 0) {
        if (c.obrigatorio) return erro('obrigatorio')
        continue
      }
      if (marcadas.some((v) => !c.opcoes?.includes(v))) return erro('invalido')
      respostas.push({ rotulo: c.rotulo, tipo: c.tipo, valor: marcadas })
      continue
    }

    let valor = typeof bruto === 'string' ? bruto.trim() : ''
    if (!valor) {
      if (c.obrigatorio) return erro('obrigatorio')
      continue
    }
    if (valor.length > LIMITE_RESPOSTA[c.tipo]) return erro('invalido')

    if (c.tipo === 'whatsapp') {
      const numero = normalizarWhatsapp(valor)
      if (!numero) return erro('invalido')
      valor = numero
    } else if (c.tipo === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) return erro('invalido')
      valor = valor.toLowerCase()
    } else if (c.tipo === 'numero') {
      if (!/^-?\d+([.,]\d+)?$/.test(valor)) return erro('invalido')
    } else if (c.tipo === 'data') {
      if (!dataValida(valor)) return erro('invalido')
    } else if (c.tipo === 'uma') {
      if (!c.opcoes?.includes(valor)) return erro('invalido')
    }

    respostas.push({ rotulo: c.rotulo, tipo: c.tipo, valor })
  }

  if (respostas.length === 0) return { ok: false, campo: null, motivo: 'vazio' }
  return { ok: true, respostas }
}
