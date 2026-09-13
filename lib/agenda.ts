import { horarioPadrao, type DadosItem, type DiaHorario } from '@/lib/types'

// Os horarios sao guardados como hora local do negocio (dia + HH:MM), sem
// fuso. O fuso so entra para saber que horas sao agora e nao oferecer um
// horario que ja passou.
export const FUSO_AGENDA = 'America/Sao_Paulo'

export const DURACOES = [15, 30, 45, 60, 90, 120] as const
export const DIAS_A_FRENTE = [7, 14, 30, 60, 90] as const
export const ANTECEDENCIAS = [0, 1, 2, 4, 12, 24] as const

export type ConfigAgenda = {
  dias: DiaHorario[]
  duracao: number
  diasAFrente: number
  antecedencia: number
}

export function configAgenda(data: DadosItem | null | undefined): ConfigAgenda {
  return {
    dias: data?.dias?.length ? data.dias : horarioPadrao(),
    duracao: data?.duracao && data.duracao >= 5 ? data.duracao : 60,
    diasAFrente:
      data?.diasAFrente && data.diasAFrente > 0 ? Math.min(data.diasAFrente, 365) : 30,
    antecedencia:
      data?.antecedencia && data.antecedencia > 0 ? Math.min(data.antecedencia, 720) : 0,
  }
}

const CHAVES_DIA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const

// Datas 'AAAA-MM-DD' tratadas em UTC so como calendario: sem hora, o dia da
// semana e a soma de dias nao dependem do fuso de quem esta rodando o codigo.
function dataUtc(dia: string) {
  return new Date(`${dia}T00:00:00Z`)
}

export function ehDia(valor: unknown): valor is string {
  return (
    typeof valor === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(valor) &&
    !Number.isNaN(dataUtc(valor).getTime()) &&
    dataUtc(valor).toISOString().slice(0, 10) === valor
  )
}

export function ehHora(valor: unknown): valor is string {
  return typeof valor === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(valor)
}

export function diaDaSemana(dia: string) {
  return CHAVES_DIA[dataUtc(dia).getUTCDay()]
}

export function somarDias(dia: string, n: number) {
  const data = dataUtc(dia)
  data.setUTCDate(data.getUTCDate() + n)
  return data.toISOString().slice(0, 10)
}

function diasEntre(de: string, ate: string) {
  return Math.round((dataUtc(ate).getTime() - dataUtc(de).getTime()) / 86400000)
}

function paraMinutos(hora: string) {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

function deMinutos(minutos: number) {
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`
}

export type Agora = { dia: string; minutos: number }

export function agoraNoFuso(fuso = FUSO_AGENDA): Agora {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: fuso,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  )
  return {
    dia: `${partes.year}-${partes.month}-${partes.day}`,
    minutos: Number(partes.hour) * 60 + Number(partes.minute),
  }
}

export function diaNaJanela(config: ConfigAgenda, dia: string, agora: Agora) {
  return dia >= agora.dia && dia <= somarDias(agora.dia, config.diasAFrente)
}

// Todos os horarios que o expediente do dia comporta, sem olhar ocupacao.
// Um horario so entra se couber inteiro antes de fechar.
export function horariosDoDia(config: ConfigAgenda, dia: string) {
  const regra = config.dias.find((d) => d.dia === diaDaSemana(dia))
  if (!regra || regra.fechado || !ehHora(regra.abre) || !ehHora(regra.fecha)) return []

  const fim = paraMinutos(regra.fecha)
  const lista: string[] = []
  for (let m = paraMinutos(regra.abre); m + config.duracao <= fim; m += config.duracao) {
    lista.push(deMinutos(m))
  }
  return lista
}

// A antecedencia pode atravessar a meia-noite: 12 h antes de um horario das
// 8h de amanha ja e hoje as 20h. Por isso a conta e em minutos absolutos.
// Vale para marcar e tambem para o visitante cancelar ou remarcar.
export function respeitaAntecedencia(config: ConfigAgenda, dia: string, hora: string, agora: Agora) {
  return (
    diasEntre(agora.dia, dia) * 1440 + paraMinutos(hora) >
    agora.minutos + config.antecedencia * 60
  )
}

export function horariosLivres(
  config: ConfigAgenda,
  dia: string,
  ocupados: string[],
  agora: Agora
) {
  if (!diaNaJanela(config, dia, agora)) return []

  const tomados = new Set(ocupados)
  return horariosDoDia(config, dia).filter(
    (hora) => !tomados.has(hora) && respeitaAntecedencia(config, dia, hora, agora)
  )
}
