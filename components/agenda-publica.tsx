'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  agoraNoFuso,
  diaNaJanela,
  horariosDoDia,
  somarDias,
  type Agora,
  type ConfigAgenda,
} from '@/lib/agenda'
import { useIdioma, useT } from '@/lib/i18n/contexto'
import type { Dicionario, Idioma } from '@/lib/i18n/dicionarios'

type Chave = keyof Dicionario
type Acesso = { token: string; email: string }
type MeuAgendamento = { id: string; dia: string; hora: string; status: string; alteravel: boolean }

const campo =
  'mt-2 w-full rounded-xl border border-border bg-transparent px-4 py-3 text-base outline-none focus:border-fg'
const botaoPrincipal =
  'w-full rounded-xl bg-brand px-5 py-3 text-base font-semibold text-brand-fg disabled:opacity-50'
const botaoLink = 'text-sm text-muted underline underline-offset-4'

function dataUtc(dia: string) {
  return new Date(`${dia}T00:00:00Z`)
}

function formatoDia(idioma: Idioma) {
  return new Intl.DateTimeFormat(idioma, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

function emailValido(valor: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())
}

function normalizarTelefone(valor: string) {
  const digitos = valor.replace(/\D/g, '')
  // Sem codigo de pais vale o Brasil, que e o caso de quase todo visitante.
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`
  return digitos.length >= 12 && digitos.length <= 15 ? digitos : null
}

// O navegador guarda o acesso ja confirmado a "Meus agendamentos": quem volta
// no mesmo celular nao pede outro codigo. O localStorage pode estar bloqueado
// (aba anonima, alguns navegadores embutidos), dai o try em tudo.
function chaveAcesso(itemId: string) {
  return `minisitee:agenda:${itemId}`
}

function lerAcessoLocal(itemId: string): Acesso | null {
  try {
    const salvo = JSON.parse(localStorage.getItem(chaveAcesso(itemId)) ?? 'null')
    return salvo && typeof salvo.token === 'string' && typeof salvo.email === 'string'
      ? salvo
      : null
  } catch {
    return null
  }
}

function gravarAcessoLocal(itemId: string, acesso: Acesso | null) {
  try {
    if (acesso) localStorage.setItem(chaveAcesso(itemId), JSON.stringify(acesso))
    else localStorage.removeItem(chaveAcesso(itemId))
  } catch {}
}

function postar(url: string, corpo: object, token?: string) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(corpo),
  })
}

function useHorarios(itemId: string) {
  const [horarios, setHorarios] = useState<string[] | null>(null)
  const carregar = useCallback(
    async (dia: string) => {
      setHorarios(null)
      try {
        const r = await fetch(`/api/agenda/${itemId}?dia=${dia}`, { cache: 'no-store' })
        const corpo = await r.json()
        setHorarios(r.ok && Array.isArray(corpo.horarios) ? corpo.horarios : [])
      } catch {
        setHorarios([])
      }
    },
    [itemId]
  )
  return [horarios, carregar] as const
}

export function AgendaPublica({ itemId, config }: { itemId: string; config: ConfigAgenda }) {
  // O HTML do minisite e gerado bem antes da visita. O calendario depende de
  // que dia e hoje, entao ele so monta no navegador de quem esta vendo.
  const [agora, setAgora] = useState<Agora | null>(null)
  const [modo, setModo] = useState<'agendar' | 'meus'>('agendar')

  useEffect(() => {
    setAgora(agoraNoFuso())
  }, [])

  if (!agora) return <p className="mt-3 text-center text-base text-muted">—</p>

  return modo === 'agendar' ? (
    <Agendar itemId={itemId} config={config} agora={agora} aoAbrirMeus={() => setModo('meus')} />
  ) : (
    <MeusAgendamentos
      itemId={itemId}
      config={config}
      agora={agora}
      aoVoltar={() => setModo('agendar')}
    />
  )
}

function Calendario({
  config,
  agora,
  dia,
  aoEscolher,
}: {
  config: ConfigAgenda
  agora: Agora
  dia: string | null
  aoEscolher: (dia: string) => void
}) {
  const t = useT()
  const idioma = useIdioma()
  const [mes, setMes] = useState((dia ?? agora.dia).slice(0, 7))

  const fmtMes = new Intl.DateTimeFormat(idioma, { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const fmtSemana = new Intl.DateTimeFormat(idioma, { weekday: 'narrow', timeZone: 'UTC' })
  const fmtDia = formatoDia(idioma)

  const [ano, numeroMes] = mes.split('-').map(Number)
  const limite = somarDias(agora.dia, config.diasAFrente)
  const vazios = dataUtc(`${mes}-01`).getUTCDay()
  const diasNoMes = new Date(Date.UTC(ano, numeroMes, 0)).getUTCDate()
  const celulas: (string | null)[] = [
    ...Array<null>(vazios).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`),
  ]
  // 4 de janeiro de 1970 foi um domingo: a semana do calendario comeca nele.
  const iniciais = Array.from({ length: 7 }, (_, i) =>
    fmtSemana.format(new Date(Date.UTC(1970, 0, 4 + i)))
  )

  function mudarMes(delta: number) {
    setMes(new Date(Date.UTC(ano, numeroMes - 1 + delta, 1)).toISOString().slice(0, 7))
  }

  const botaoMes = 'rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-30'

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label={t('agendaMesAnterior')}
          disabled={mes <= agora.dia.slice(0, 7)}
          onClick={() => mudarMes(-1)}
          className={botaoMes}
        >
          ‹
        </button>
        <span className="text-base font-semibold first-letter:uppercase">
          {fmtMes.format(dataUtc(`${mes}-01`))}
        </span>
        <button
          type="button"
          aria-label={t('agendaProximoMes')}
          disabled={mes >= limite.slice(0, 7)}
          onClick={() => mudarMes(1)}
          className={botaoMes}
        >
          ›
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {iniciais.map((inicial, i) => (
          <span key={i} aria-hidden="true" className="text-xs font-medium uppercase text-muted">
            {inicial}
          </span>
        ))}
        {celulas.map((celula, i) => {
          if (!celula) return <span key={`vazio-${i}`} />
          const aberto =
            diaNaJanela(config, celula, agora) && horariosDoDia(config, celula).length > 0
          const selecionado = celula === dia
          return (
            <button
              key={celula}
              type="button"
              disabled={!aberto}
              aria-pressed={selecionado}
              aria-label={fmtDia.format(dataUtc(celula))}
              onClick={() => aoEscolher(celula)}
              className={`aspect-square rounded-lg text-sm tabular-nums transition-colors disabled:opacity-30 ${
                selecionado
                  ? 'bg-brand font-semibold text-brand-fg'
                  : aberto
                    ? 'border border-border font-medium hover:border-fg'
                    : ''
              }`}
            >
              {Number(celula.slice(8))}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ListaHorarios({
  horarios,
  hora,
  aoEscolher,
}: {
  horarios: string[] | null
  hora: string | null
  aoEscolher: (hora: string) => void
}) {
  const t = useT()

  if (horarios === null) return <p className="mt-2 text-sm text-muted">{t('agendaCarregando')}</p>
  if (horarios.length === 0) return <p className="mt-2 text-sm text-muted">{t('agendaSemHorarios')}</p>

  return (
    <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
      {horarios.map((h) => (
        <li key={h}>
          <button
            type="button"
            aria-pressed={h === hora}
            onClick={() => aoEscolher(h)}
            className={`w-full rounded-lg px-2 py-2 text-sm font-medium tabular-nums ${
              h === hora ? 'bg-brand text-brand-fg' : 'border border-border hover:border-fg'
            }`}
          >
            {h}
          </button>
        </li>
      ))}
    </ul>
  )
}

function Agendar({
  itemId,
  config,
  agora,
  aoAbrirMeus,
}: {
  itemId: string
  config: ConfigAgenda
  agora: Agora
  aoAbrirMeus: () => void
}) {
  const t = useT()
  const fmtDia = formatoDia(useIdioma())
  const [horarios, carregar] = useHorarios(itemId)

  const [dia, setDia] = useState<string | null>(null)
  const [hora, setHora] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [observacao, setObservacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<Chave | null>(null)
  const [enviado, setEnviado] = useState(false)

  function escolherDia(escolhido: string) {
    setDia(escolhido)
    setHora(null)
    setErro(null)
    void carregar(escolhido)
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!dia || !hora) return

    const numero = normalizarTelefone(telefone)
    if (!nome.trim() || !emailValido(email) || !numero) {
      setErro('agendaPreenchaDados')
      return
    }

    setEnviando(true)
    setErro(null)
    try {
      const r = await postar(`/api/agenda/${itemId}`, {
        dia,
        hora,
        nome: nome.trim(),
        email: email.trim(),
        telefone: numero,
        observacao,
      })
      if (r.ok) {
        setEnviado(true)
      } else if (r.status === 409) {
        setErro('agendaOcupado')
        setHora(null)
        void carregar(dia)
      } else {
        setErro(r.status === 429 ? 'agendaLimite' : 'agendaErro')
      }
    } catch {
      setErro('agendaErro')
    } finally {
      setEnviando(false)
    }
  }

  const rodape = (
    <div className="mt-4 border-t border-border pt-3 text-center">
      <button type="button" onClick={aoAbrirMeus} className={botaoLink}>
        {t('agendaMeus')}
      </button>
    </div>
  )

  if (enviado && dia && hora) {
    return (
      <div className="mt-3 space-y-3 text-center">
        <p role="status" className="text-base font-medium">
          {t('agendaEnviado', { dia: fmtDia.format(dataUtc(dia)), hora })}
        </p>
        <button
          type="button"
          onClick={() => {
            setEnviado(false)
            setDia(null)
            setHora(null)
            setObservacao('')
          }}
          className={botaoLink}
        >
          {t('agendaNovoPedido')}
        </button>
        {rodape}
      </div>
    )
  }

  return (
    <div className="mt-3">
      <Calendario config={config} agora={agora} dia={dia} aoEscolher={escolherDia} />

      {!dia && <p className="mt-3 text-center text-sm text-muted">{t('agendaEscolhaDia')}</p>}

      {dia && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-sm font-semibold first-letter:uppercase">{fmtDia.format(dataUtc(dia))}</p>
          <ListaHorarios
            horarios={horarios}
            hora={hora}
            aoEscolher={(h) => {
              setHora(h)
              setErro(null)
            }}
          />
        </div>
      )}

      {dia && hora && (
        <form onSubmit={enviar} className="mt-4 space-y-3 border-t border-border pt-4">
          <div>
            <label htmlFor={`agenda-nome-${itemId}`} className="block text-sm font-medium">
              {t('agendaSeuNome')}
            </label>
            <input
              id={`agenda-nome-${itemId}`}
              value={nome}
              maxLength={80}
              autoComplete="name"
              onChange={(e) => setNome(e.target.value)}
              className={campo}
            />
          </div>
          <div>
            <label htmlFor={`agenda-email-${itemId}`} className="block text-sm font-medium">
              {t('agendaSeuEmail')}
            </label>
            <input
              id={`agenda-email-${itemId}`}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              maxLength={254}
              onChange={(e) => setEmail(e.target.value)}
              className={campo}
            />
          </div>
          <div>
            <label htmlFor={`agenda-tel-${itemId}`} className="block text-sm font-medium">
              {t('agendaSeuWhatsapp')}
            </label>
            <input
              id={`agenda-tel-${itemId}`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={telefone}
              placeholder="(48) 99999-9999"
              onChange={(e) => setTelefone(e.target.value)}
              className={campo}
            />
          </div>
          <div>
            <label htmlFor={`agenda-obs-${itemId}`} className="block text-sm font-medium">
              {t('agendaObservacao')} <span className="font-normal text-muted">{t('opcional')}</span>
            </label>
            <textarea
              id={`agenda-obs-${itemId}`}
              value={observacao}
              maxLength={500}
              rows={2}
              onChange={(e) => setObservacao(e.target.value)}
              className={campo}
            />
          </div>

          {erro && (
            <p role="alert" className="text-sm text-red-600">
              {t(erro)}
            </p>
          )}

          <button type="submit" disabled={enviando} className={botaoPrincipal}>
            {enviando ? t('enviando') : `${t('agendaPedir')} · ${hora}`}
          </button>
        </form>
      )}

      {erro && !hora && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {t(erro)}
        </p>
      )}

      {rodape}
    </div>
  )
}

function MeusAgendamentos({
  itemId,
  config,
  agora,
  aoVoltar,
}: {
  itemId: string
  config: ConfigAgenda
  agora: Agora
  aoVoltar: () => void
}) {
  const t = useT()
  const fmtDia = formatoDia(useIdioma())
  const [horarios, carregarHorarios] = useHorarios(itemId)

  // So monta depois do efeito que descobre a hora certa, ou seja, ja no
  // navegador: ler o localStorage aqui nao desencontra da renderizacao do servidor.
  const [acesso, setAcesso] = useState<Acesso | null>(() => lerAcessoLocal(itemId))
  const [email, setEmail] = useState(acesso?.email ?? '')
  const [etapa, setEtapa] = useState<'email' | 'codigo'>('email')
  const [codigo, setCodigo] = useState('')
  const [lista, setLista] = useState<MeuAgendamento[] | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<Chave | null>(null)
  const [aviso, setAviso] = useState<Chave | null>(null)
  const [cancelando, setCancelando] = useState<string | null>(null)
  const [remarcando, setRemarcando] = useState<MeuAgendamento | null>(null)
  const [novoDia, setNovoDia] = useState<string | null>(null)
  const [novaHora, setNovaHora] = useState<string | null>(null)

  const sair = useCallback(() => {
    gravarAcessoLocal(itemId, null)
    setAcesso(null)
    setLista(null)
    setEtapa('email')
    setCodigo('')
  }, [itemId])

  const carregarLista = useCallback(
    async (atual: Acesso) => {
      try {
        const r = await fetch(`/api/agenda/${itemId}/meus`, {
          headers: { Authorization: `Bearer ${atual.token}` },
          cache: 'no-store',
        })
        // Acesso vencido: volta para o pedido de codigo.
        if (r.status === 401) {
          sair()
          return
        }
        const corpo = await r.json()
        if (r.ok && Array.isArray(corpo.agendamentos)) {
          setLista(corpo.agendamentos)
        } else {
          setLista([])
          setErro('agendaErro')
        }
      } catch {
        setLista([])
        setErro('agendaErro')
      }
    },
    [itemId, sair]
  )

  useEffect(() => {
    if (acesso) void carregarLista(acesso)
  }, [acesso, carregarLista])

  function limparMensagens() {
    setErro(null)
    setAviso(null)
  }

  async function pedirCodigo(e: React.FormEvent) {
    e.preventDefault()
    limparMensagens()
    if (!emailValido(email)) {
      setErro('emailInvalido')
      return
    }

    setOcupado(true)
    try {
      const r = await postar(`/api/agenda/${itemId}/acesso`, { email: email.trim() })
      if (r.ok) {
        setEtapa('codigo')
        setAviso('agendaCodigoEnviado')
      } else {
        setErro(
          r.status === 429
            ? 'agendaAguarde'
            : r.status === 503
              ? 'agendaEmailIndisponivel'
              : r.status === 400
                ? 'emailInvalido'
                : 'agendaErro'
        )
      }
    } catch {
      setErro('agendaErro')
    } finally {
      setOcupado(false)
    }
  }

  async function confirmarCodigo(e: React.FormEvent) {
    e.preventDefault()
    limparMensagens()
    setOcupado(true)
    try {
      const r = await postar(`/api/agenda/${itemId}/acesso`, { email: email.trim(), codigo })
      const corpo = await r.json().catch(() => ({}))
      if (r.ok && typeof corpo.token === 'string') {
        const novo = { token: corpo.token, email: email.trim().toLowerCase() }
        gravarAcessoLocal(itemId, novo)
        setAcesso(novo)
        setCodigo('')
      } else {
        setErro(r.status === 429 ? 'agendaMuitasTentativas' : 'agendaCodigoInvalido')
      }
    } catch {
      setErro('agendaErro')
    } finally {
      setOcupado(false)
    }
  }

  async function alterar(corpo: Record<string, string>, sucesso: Chave) {
    if (!acesso) return
    limparMensagens()
    setOcupado(true)
    try {
      const r = await postar(`/api/agenda/${itemId}/meus`, corpo, acesso.token)
      const retorno = await r.json().catch(() => ({}))
      if (r.status === 401) {
        sair()
      } else if (r.ok) {
        setAviso(sucesso)
        setCancelando(null)
        setRemarcando(null)
        setNovoDia(null)
        setNovaHora(null)
        void carregarLista(acesso)
      } else if (retorno.erro === 'ocupado') {
        setErro('agendaOcupado')
        setNovaHora(null)
        if (novoDia) void carregarHorarios(novoDia)
      } else {
        setErro(retorno.erro === 'emCimaDaHora' ? 'agendaEmCimaDaHora' : 'agendaErro')
      }
    } catch {
      setErro('agendaErro')
    } finally {
      setOcupado(false)
    }
  }

  const mensagens = (
    <>
      {aviso && (
        <p role="status" className="mt-3 text-sm">
          {t(aviso, { email: email.trim() })}
        </p>
      )}
      {erro && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {t(erro)}
        </p>
      )}
    </>
  )

  const rodape = (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-4 border-t border-border pt-3">
      <button type="button" onClick={aoVoltar} className={botaoLink}>
        {t('agendaVoltarAgendar')}
      </button>
      {acesso && (
        <button type="button" onClick={sair} className={botaoLink}>
          {t('agendaTrocarEmail')}
        </button>
      )}
    </div>
  )

  if (!acesso) {
    return (
      <div className="mt-3">
        <p className="text-center text-base font-semibold">{t('agendaMeus')}</p>

        {etapa === 'email' ? (
          <form onSubmit={pedirCodigo} className="mt-3 space-y-3">
            <p className="text-sm text-muted">{t('agendaMeusAjuda')}</p>
            <div>
              <label htmlFor={`agenda-acesso-${itemId}`} className="block text-sm font-medium">
                {t('agendaSeuEmail')}
              </label>
              <input
                id={`agenda-acesso-${itemId}`}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={campo}
              />
            </div>
            <button type="submit" disabled={ocupado} className={botaoPrincipal}>
              {ocupado ? t('enviando') : t('agendaReceberCodigo')}
            </button>
          </form>
        ) : (
          <form onSubmit={confirmarCodigo} className="mt-3 space-y-3">
            <div>
              <label htmlFor={`agenda-codigo-${itemId}`} className="block text-sm font-medium">
                {t('agendaCodigo')}
              </label>
              <input
                id={`agenda-codigo-${itemId}`}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`${campo} text-center text-2xl tracking-[0.4em] tabular-nums`}
              />
            </div>
            <button
              type="submit"
              disabled={ocupado || codigo.length !== 6}
              className={botaoPrincipal}
            >
              {t('agendaVerMeus')}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setEtapa('email')
                  setCodigo('')
                  limparMensagens()
                }}
                className={botaoLink}
              >
                {t('agendaTrocarEmail')}
              </button>
            </div>
          </form>
        )}

        {mensagens}
        {rodape}
      </div>
    )
  }

  if (remarcando) {
    return (
      <div className="mt-3">
        <p className="text-sm font-semibold">{t('agendaEscolhaNovo')}</p>
        <p className="text-xs text-muted first-letter:uppercase">
          {fmtDia.format(dataUtc(remarcando.dia))} · {remarcando.hora}
        </p>

        <div className="mt-3">
          <Calendario
            config={config}
            agora={agora}
            dia={novoDia}
            aoEscolher={(escolhido) => {
              setNovoDia(escolhido)
              setNovaHora(null)
              limparMensagens()
              void carregarHorarios(escolhido)
            }}
          />
        </div>

        {novoDia && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-sm font-semibold first-letter:uppercase">
              {fmtDia.format(dataUtc(novoDia))}
            </p>
            <ListaHorarios
              horarios={horarios}
              hora={novaHora}
              aoEscolher={(h) => {
                setNovaHora(h)
                limparMensagens()
              }}
            />
          </div>
        )}

        {novoDia && novaHora && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() =>
              void alterar(
                { acao: 'remarcar', id: remarcando.id, dia: novoDia, hora: novaHora },
                'agendaRemarcado'
              )
            }
            className={`mt-4 ${botaoPrincipal}`}
          >
            {t('agendaConfirmarRemarcacao', { dia: fmtDia.format(dataUtc(novoDia)), hora: novaHora })}
          </button>
        )}

        {mensagens}

        <div className="mt-4 border-t border-border pt-3 text-center">
          <button
            type="button"
            onClick={() => {
              setRemarcando(null)
              setNovoDia(null)
              setNovaHora(null)
              limparMensagens()
            }}
            className={botaoLink}
          >
            {t('cancelar')}
          </button>
        </div>
      </div>
    )
  }

  const rotulos: Record<string, Chave> = {
    pendente: 'agendaPendente',
    confirmado: 'agendaConfirmado',
    cancelado: 'agendaCancelado',
  }

  return (
    <div className="mt-3">
      <p className="text-center text-base font-semibold">{t('agendaMeus')}</p>
      <p className="text-center text-xs text-muted">{acesso.email}</p>

      {lista === null ? (
        <p className="mt-3 text-center text-sm text-muted">{t('agendaCarregando')}</p>
      ) : lista.length === 0 ? (
        <p className="mt-3 text-center text-sm text-muted">{t('agendaNenhumMeu')}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {lista.map((a) => (
            <li key={a.id} className="rounded-xl border border-border px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className={`min-w-0 ${a.status === 'cancelado' ? 'text-muted line-through' : ''}`}>
                  <p className="text-sm font-semibold first-letter:uppercase">
                    {fmtDia.format(dataUtc(a.dia))}
                  </p>
                  <p className="text-sm tabular-nums">{a.hora}</p>
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {t(rotulos[a.status] ?? 'agendaPendente')}
                </span>
              </div>

              {a.alteravel &&
                (cancelando === a.id ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs">{t('agendaCancelarConfirma')}</span>
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => void alterar({ acao: 'cancelar', id: a.id }, 'agendaCanceladoOk')}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                    >
                      {t('agendaSimCancelar')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCancelando(null)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs"
                    >
                      {t('agendaNao')}
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRemarcando(a)
                        limparMensagens()
                      }}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs"
                    >
                      {t('agendaRemarcar')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCancelando(a.id)
                        limparMensagens()
                      }}
                      className="rounded-lg px-3 py-1.5 text-xs text-red-600"
                    >
                      {t('cancelar')}
                    </button>
                  </div>
                ))}
            </li>
          ))}
        </ul>
      )}

      {mensagens}
      {rodape}
    </div>
  )
}
