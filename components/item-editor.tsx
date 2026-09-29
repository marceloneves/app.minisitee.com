'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { PhotoUploader, type Foto } from '@/components/photo-uploader'
import { ArquivoUploader } from '@/components/arquivo-uploader'
import { RedeIcone } from '@/components/rede-icone'
import { useIdioma, useT } from '@/lib/i18n/contexto'
import { DIAS, ROTULO_STATUS, TITULO_EDITOR, type Dicionario } from '@/lib/i18n/dicionarios'
import { excluirItem, salvarItem, type PatchItem } from '@/lib/actions/items'
import { precoDoTexto } from '@/lib/format'
import {
  DIAS_SEMANA,
  REDES,
  horarioPadrao,
  statusDoTipo,
  type CampoFormulario,
  type DadosItem,
  type TipoCampo,
  type TipoItem,
} from '@/lib/types'
import { CampoTelefone } from '@/components/campo-telefone'
import { QrCode, urlDoQrCode } from '@/components/qr-code'
import { ANTECEDENCIAS, DIAS_A_FRENTE, DURACOES, configAgenda } from '@/lib/agenda'
import { corHexValida } from '@/lib/cor'
import { MAX_CAMPOS, TIPOS_CAMPO, novoIdCampo } from '@/lib/formulario'

export type ItemForm = {
  id: string
  kind: TipoItem
  title: string
  url: string
  whatsappMessage: string
  dados: DadosItem
  status: string
  price: string
}

type Estado = 'limpo' | 'sujo' | 'salvando' | 'salvo' | 'erro'

export function ItemEditor({
  inicial,
  fotosIniciais,
  whatsappDoPerfil,
  ehNovo,
}: {
  inicial: ItemForm
  fotosIniciais: Foto[]
  whatsappDoPerfil: string | null
  ehNovo: boolean
}) {
  const t = useT()
  const idioma = useIdioma()
  const router = useRouter()
  const [form, setForm] = useState(inicial)
  const [estado, setEstado] = useState<Estado>('limpo')
  const [erro, setErro] = useState<string | null>(null)
  // Guardado na abertura: o primeiro salvamento automatico ja faz a pagina
  // chegar com ehNovo falso, e o titulo nao pode virar no meio da edicao.
  const [nasceuAgora] = useState(ehNovo)

  const pedido = useRef(0)
  // O que ja esta no banco, para o salvamento automatico so disparar quando o
  // formulario de fato mudou.
  const ultimoSalvo = useRef(JSON.stringify(inicial))
  // Algo desta ferramenta ja foi gravado nesta tela (formulario ou foto):
  // voltar deixa de apagar a ferramenta nova.
  const mexeu = useRef(false)

  const salvar = useCallback(async (atual: ItemForm) => {
    const id = ++pedido.current
    const json = JSON.stringify(atual)
    setEstado('salvando')

    const patch: PatchItem =
      atual.kind === 'produto'
        ? {
            // Produto pode ficar sem descricao: o cartao mostra a foto e o preco.
            title: atual.title.trim(),
            status: atual.status,
            ...precoDoTexto(atual.price),
            url: linkDoProduto(atual.url),
          }
        : atual.kind === 'link' || atual.kind === 'qrcode'
          ? {
              title: atual.title.trim() || 'Sem título',
              status: atual.status,
              url: atual.url.trim() || 'https://',
            }
          : atual.kind === 'whatsapp'
            ? {
                title: atual.title.trim() || 'Sem título',
                status: atual.status,
                whatsapp_message: atual.whatsappMessage.trim() || null,
                data: atual.dados,
              }
            : {
                title: atual.title.trim() || 'Sem título',
                status: atual.status,
                data: atual.dados,
              }

    const r = await salvarItem(atual.id, patch)
    // Um pedido mais novo ja saiu e responde por este: nao e erro.
    if (id !== pedido.current) return true

    if ('erro' in r && r.erro) {
      setEstado('erro')
      setErro(r.erro)
      return false
    }

    ultimoSalvo.current = json
    mexeu.current = true
    setErro(null)
    setEstado('salvo')
    return true
  }, [])

  // Salva sozinho, sem botao: um segundo depois da ultima mudanca. A espera
  // junta a digitacao num salvamento so; resposta de um pedido antigo que chega
  // depois de um novo e ignorada em salvar().
  useEffect(() => {
    if (JSON.stringify(form) === ultimoSalvo.current) return
    const espera = setTimeout(() => void salvar(form), 1000)
    return () => clearTimeout(espera)
  }, [form, salvar])

  // Fechar a aba antes do salvamento automatico sair perderia a ultima mudanca.
  useEffect(() => {
    if (estado !== 'sujo' && estado !== 'salvando') return

    function avisar(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [estado])

  // Uma ferramenta nasce gravada no banco (o upload de foto precisa do id).
  // Voltar de uma nova sem ter preenchido nada apaga esse rascunho vazio. Com
  // mudanca ainda esperando o salvamento automatico, salva antes de sair.
  async function voltar() {
    const pendente = JSON.stringify(form) !== ultimoSalvo.current
    if (ehNovo && !mexeu.current && !pendente) {
      setEstado('salvando')
      await excluirItem(form.id)
    } else if (pendente && !(await salvar(form))) {
      return
    }
    router.push('/painel')
    router.refresh()
  }

  function mudarDados(patch: Partial<DadosItem>) {
    setEstado('sujo')
    setForm((f) => ({ ...f, dados: { ...f.dados, ...patch } }))
  }

  function mudar<K extends keyof ItemForm>(campo: K, valor: ItemForm[K]) {
    setEstado('sujo')
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 flex items-center justify-end border-b border-border bg-bg/90 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-3">
          <IndicadorSalvamento estado={estado} erro={erro} />

          <button
            type="button"
            onClick={() => void voltar()}
            className="rounded-lg border border-border px-3 py-1.5 text-sm"
          >
            {t('voltar')}
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-6">
        <h1 className="text-xl font-semibold tracking-tight">
          {TITULO_EDITOR[idioma][form.kind]?.[nasceuAgora ? 0 : 1]}
        </h1>
        <Secao>
          <Texto
            id="titulo"
            rotulo={
              form.kind === 'produto'
                ? t('descricaoProduto')
                : form.kind === 'qrcode' ||
                    form.kind === 'agenda' ||
                    form.kind === 'formulario'
                  ? t('titulo')
                  : t('textoBotao')
            }
            valor={form.title}
            aoMudar={(v) => mudar('title', v)}
            placeholder={
              form.kind === 'produto'
                ? 'Descreva aqui o produto'
                : form.kind === 'whatsapp'
                  ? 'Fazer meu pedido'
                  : form.kind === 'qrcode'
                    ? 'Escaneie para ver o cardápio'
                    : form.kind === 'agenda'
                      ? 'Agende seu horário'
                      : form.kind === 'formulario'
                        ? 'Peça seu orçamento'
                        : 'Ver meu Instagram'
            }
          />

          {form.kind === 'produto' && (
            <Texto
              id="url"
              rotulo={t('linkPagamento')}
              opcional
              valor={form.url}
              aoMudar={(v) => mudar('url', v)}
              placeholder="Cole o link do Mercado Pago, PagSeguro, Stripe..."
            />
          )}

          {form.kind === 'produto' && (
            <div>
              <Texto
                id="preco"
                rotulo={t('preco')}
                opcional
                valor={form.price}
                aoMudar={(v) => mudar('price', v)}
                placeholder="R$ 25,00 · a partir de R$ 90 · R$ 40 por hora"
              />
              <p className="mt-2 text-xs text-muted">{t('precoVazio')}</p>
            </div>
          )}

          {form.kind === 'link' && (
            <Texto
              id="url"
              rotulo={t('enderecoLink')}
              valor={form.url}
              aoMudar={(v) => mudar('url', v)}
              placeholder="https://instagram.com/seuperfil"
            />
          )}

          {form.kind === 'qrcode' && (
            <div>
              <Texto
                id="url"
                rotulo={t('enderecoQrCode')}
                valor={form.url}
                aoMudar={(v) => mudar('url', v)}
                placeholder="https://seusite.com/cardapio"
              />
              {urlDoQrCode(form.url) && (
                <QrCode
                  valor={urlDoQrCode(form.url)!}
                  className="mt-4 w-40 rounded-xl border border-border"
                />
              )}
            </div>
          )}

          {form.kind === 'telefone' && (
            <CampoTelefone
              id="telefone"
              rotulo={t('telefone')}
              valor={form.dados.telefone ?? '55'}
              aoMudar={(v) => mudarDados({ telefone: v })}
            />
          )}

          {form.kind === 'endereco' && (
            <div>
              <label htmlFor="endereco" className="block text-sm font-medium">
                {t('enderecoCompleto')}
              </label>
              <textarea
                id="endereco"
                value={form.dados.endereco ?? ''}
                onChange={(e) => mudarDados({ endereco: e.target.value })}
                rows={2}
                placeholder="Rua das Flores, 123 — Centro, Florianópolis/SC"
                className="mt-2 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-fg"
              />
              <p className="mt-2 text-xs text-muted">
                {t('mapaAjuda')}
              </p>
            </div>
          )}

          {form.kind === 'redes' && (
            <EditorRedes
              links={form.dados.links ?? []}
              aoMudar={(links) => mudarDados({ links })}
            />
          )}

          {form.kind === 'horario' && (
            <EditorHorario
              dias={form.dados.dias ?? horarioPadrao()}
              aoMudar={(dias) => mudarDados({ dias })}
            />
          )}

          {form.kind === 'arquivo' && (
            <ArquivoUploader
              itemId={form.id}
              url={form.dados.arquivoUrl}
              nome={form.dados.arquivoNome}
              tamanho={form.dados.arquivoTamanho}
              aoMudar={(d) => mudarDados(d)}
            />
          )}

          {form.kind === 'contagem' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="alvo" className="block text-sm font-medium">
                  {t('dataHoraFim')}
                </label>
                <input
                  id="alvo"
                  type="datetime-local"
                  value={form.dados.alvo ?? ''}
                  onChange={(e) => mudarDados({ alvo: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-fg"
                />
              </div>
              <Texto
                id="texto-fim"
                rotulo={t('textoQuandoAcabar')}
                opcional
                valor={form.dados.textoFim ?? ''}
                aoMudar={(v) => mudarDados({ textoFim: v })}
                placeholder="Encerrado!"
              />
            </div>
          )}

          {form.kind === 'agenda' && (
            <EditorAgenda dados={form.dados} aoMudar={mudarDados} />
          )}

          {form.kind === 'formulario' && (
            <EditorFormulario itemId={form.id} dados={form.dados} aoMudar={mudarDados} />
          )}

          {form.kind === 'faq' && (
            <EditorFaq
              perguntas={form.dados.perguntas ?? []}
              aoMudar={(perguntas) => mudarDados({ perguntas })}
            />
          )}

          {form.kind === 'whatsapp' && (
            <CampoTelefone
              id="whatsapp-numero"
              rotulo={`${t('whatsappNumero')} ${t('opcional')}`}
              ajuda={t('whatsappNumeroAjuda')}
              // Sem numero proprio, o campo ja vem com o WhatsApp do perfil:
              // e o numero que o botao usa enquanto ninguem troca.
              valor={form.dados.telefone || whatsappDoPerfil || '55'}
              aoMudar={(v) => mudarDados({ telefone: v })}
            />
          )}

          {form.kind === 'whatsapp' && (
            <div>
              <label htmlFor="mensagem" className="block text-sm font-medium">
                {t('mensagemPronta')}{' '}
                <span className="font-normal text-muted">{t('opcional')}</span>
              </label>
              <textarea
                id="mensagem"
                value={form.whatsappMessage}
                onChange={(e) => mudar('whatsappMessage', e.target.value)}
                rows={3}
                placeholder="Oi! Quero fazer um pedido."
                className="mt-2 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-fg"
              />
              <p className="mt-2 text-xs text-muted">
                {t('mensagemProntaAjuda')}
              </p>
            </div>
          )}
        </Secao>

        <Secao
          titulo={form.kind === 'produto' ? t('fotosProduto') : t('fotos')}
          visivelEm={['produto', 'galeria']} kind={form.kind}>
          <PhotoUploader
            itemId={form.id}
            iniciais={fotosIniciais}
            // A foto ja vai para o banco no upload; aqui so marca que a
            // ferramenta nova deixou de estar vazia.
            aoMudar={() => {
              mexeu.current = true
            }}
          />
        </Secao>

        {/* Status por ultimo: primeiro a pessoa monta a ferramenta, depois
            decide se ela ja aparece no minisite. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="status" className="block text-sm font-medium">
              {t('status')}
            </label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => mudar('status', e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-fg"
            >
              {statusDoTipo().map(([v]) => (
                <option key={v} value={v}>
                  {ROTULO_STATUS[idioma][v]}
                </option>
              ))}
            </select>
          </div>
        </div>
        {form.status === 'rascunho' && (
          <p className="-mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {t('avisoRascunho')}
          </p>
        )}
      </div>
    </div>
  )
}

// Produto nao tem pagina propria: o card so abre alguma coisa quando o dono
// informa o link. Sem protocolo, entra https:// para o link nao virar um
// caminho relativo dentro do minisite.
function linkDoProduto(valor: string) {
  const url = valor.trim()
  if (!url) return null
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

function IndicadorSalvamento({ estado, erro }: { estado: Estado; erro: string | null }) {
  const t = useT()
  if (estado === 'erro') {
    return (
      <span role="alert" className="text-xs text-red-600">
        {erro ?? t('erroSalvar')}
      </span>
    )
  }
  // "Sujo" dura so o segundo ate o salvamento automatico sair.
  if (estado === 'sujo' || estado === 'salvando') {
    return <span className="text-xs text-muted">{t('salvando')}</span>
  }
  if (estado === 'salvo') {
    return <span className="text-xs text-muted">{t('salvo')}</span>
  }
  return null
}


function Secao({
  titulo,
  children,
  somenteProduto,
  visivelEm,
  kind,
}: {
  // Sem titulo, a secao so agrupa os campos.
  titulo?: string
  children: React.ReactNode
  somenteProduto?: boolean
  visivelEm?: TipoItem[]
  kind?: TipoItem
}) {
  if (visivelEm && kind && !visivelEm.includes(kind)) return null
  if (somenteProduto && kind !== 'produto') return null
  return (
    <section className="space-y-4">
      {titulo && <h2 className="text-sm font-semibold text-muted">{titulo}</h2>}
      {children}
    </section>
  )
}

function Texto({
  id,
  rotulo,
  valor,
  aoMudar,
  placeholder,
  opcional,
}: {
  id: string
  rotulo: string
  valor: string
  aoMudar: (v: string) => void
  placeholder?: string
  opcional?: boolean
}) {
  const t = useT()
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {rotulo}
        {opcional && <span className="ml-1 font-normal text-muted">{t('opcional')}</span>}
      </label>
      <input
        id={id}
        value={valor}
        placeholder={placeholder}
        onChange={(e) => aoMudar(e.target.value)}
        className="mt-2 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-fg"
      />
    </div>
  )
}


function EditorRedes({
  links,
  aoMudar,
}: {
  links: { rede: string; url: string }[]
  aoMudar: (l: { rede: string; url: string }[]) => void
}) {
  const t = useT()
  return (
    <div>
      <span className="block text-sm font-medium">{t('perfis')}</span>

      <ul className="mt-2 space-y-2">
        {links.map((link, i) => (
          <li key={i} className="flex items-center gap-2">
            <RedeIcone rede={link.rede} tamanho="size-7" />
            <select
              aria-label={t('rede')}
              value={link.rede}
              onChange={(e) =>
                aoMudar(
                  links.map((l, j) => (j === i ? { ...l, rede: e.target.value } : l))
                )
              }
              className="w-32 shrink-0 rounded-xl border border-border bg-bg px-2 py-2.5 text-sm outline-none focus:border-fg"
            >
              {REDES.map(([v, nome]) => (
                <option key={v} value={v}>
                  {nome}
                </option>
              ))}
            </select>
            <input
              aria-label={t('enderecoPerfil')}
              value={link.url}
              placeholder="https://instagram.com/seuperfil"
              onChange={(e) =>
                aoMudar(
                  links.map((l, j) => (j === i ? { ...l, url: e.target.value } : l))
                )
              }
              className="min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-fg"
            />
            <button
              type="button"
              aria-label="Remover"
              onClick={() => aoMudar(links.filter((_, j) => j !== i))}
              className="shrink-0 rounded-xl border border-border px-3 text-sm text-red-600"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => aoMudar([...links, { rede: 'instagram', url: '' }])}
        className="mt-2 w-full rounded-xl border border-dashed border-border px-4 py-2.5 text-sm text-muted"
      >
        {t('adicionarRede')}
      </button>
    </div>
  )
}

function EditorHorario({
  dias,
  aoMudar,
}: {
  dias: { dia: string; abre: string; fecha: string; fechado: boolean }[]
  aoMudar: (d: { dia: string; abre: string; fecha: string; fechado: boolean }[]) => void
}) {
  const t = useT()
  const idioma = useIdioma()
  return (
    <ul className="space-y-2">
      {DIAS_SEMANA.map(([chave]) => {
        const atual = dias.find((d) => d.dia === chave) ?? {
          dia: chave,
          abre: '09:00',
          fecha: '18:00',
          fechado: false,
        }
        const atualizar = (patch: Partial<typeof atual>) =>
          aoMudar(
            DIAS_SEMANA.map(([k]) => {
              const base = dias.find((d) => d.dia === k) ?? {
                dia: k,
                abre: '09:00',
                fecha: '18:00',
                fechado: false,
              }
              return k === chave ? { ...base, ...patch } : base
            })
          )

        return (
          <li key={chave} className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-sm">{DIAS[idioma][chave]}</span>

            {atual.fechado ? (
              <span className="flex-1 text-sm text-muted">{t('fechado')}</span>
            ) : (
              <>
                <input
                  type="time"
                  aria-label={`${DIAS[idioma][chave]} ${t('as')}`}
                  value={atual.abre}
                  onChange={(e) => atualizar({ abre: e.target.value })}
                  className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm outline-none focus:border-fg"
                />
                <span className="text-xs text-muted">{t('as')}</span>
                <input
                  type="time"
                  aria-label={`${DIAS[idioma][chave]} ${t('fechado')}`}
                  value={atual.fecha}
                  onChange={(e) => atualizar({ fecha: e.target.value })}
                  className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm outline-none focus:border-fg"
                />
              </>
            )}

            <label className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-muted">
              <input
                type="checkbox"
                checked={atual.fechado}
                onChange={(e) => atualizar({ fechado: e.target.checked })}
              />
              {t('fechado')}
            </label>
          </li>
        )
      })}
    </ul>
  )
}


function EditorAgenda({
  dados,
  aoMudar,
}: {
  dados: DadosItem
  aoMudar: (patch: Partial<DadosItem>) => void
}) {
  const t = useT()
  const config = configAgenda(dados)
  const seletor =
    'mt-2 w-full rounded-xl border border-border bg-bg px-3 py-3 text-base font-normal outline-none focus:border-fg'

  return (
    <div className="space-y-5">
      <div>
        <span className="block text-sm font-medium">{t('agendaDisponibilidade')}</span>
        <div className="mt-2">
          <EditorHorario dias={config.dias} aoMudar={(dias) => aoMudar({ dias })} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="block text-sm font-medium">
          {t('agendaDuracao')}
          <select
            value={config.duracao}
            onChange={(e) => aoMudar({ duracao: Number(e.target.value) })}
            className={seletor}
          >
            {DURACOES.map((n) => (
              <option key={n} value={n}>
                {t('agendaMinutos', { n })}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          {t('agendaDiasAFrente')}
          <select
            value={config.diasAFrente}
            onChange={(e) => aoMudar({ diasAFrente: Number(e.target.value) })}
            className={seletor}
          >
            {DIAS_A_FRENTE.map((n) => (
              <option key={n} value={n}>
                {t('agendaDias', { n })}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          {t('agendaAntecedencia')}
          <select
            value={config.antecedencia}
            onChange={(e) => aoMudar({ antecedencia: Number(e.target.value) })}
            className={seletor}
          >
            {ANTECEDENCIAS.map((n) => (
              <option key={n} value={n}>
                {n === 0 ? t('agendaSemAntecedencia') : t('agendaHoras', { n })}
              </option>
            ))}
          </select>
        </label>
      </div>

      <CampoCor
        id="agenda-cor"
        valor={dados.corFundo}
        aoMudar={(corFundo) => aoMudar({ corFundo })}
      />

      <Link href="/painel/agenda" className="inline-block text-sm underline underline-offset-4">
        {t('agendaVerCompromissos')}
      </Link>
    </div>
  )
}

// Cor de fundo do cartao na pagina publica. Sem cor escolhida vale a do estilo.
function CampoCor({
  id,
  valor,
  aoMudar,
}: {
  id: string
  valor: string | undefined
  aoMudar: (cor: string | undefined) => void
}) {
  const t = useT()
  const cor = corHexValida(valor)

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {t('agendaCorFundo')}
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <input
          id={id}
          type="color"
          value={cor ?? '#ffffff'}
          onChange={(e) => aoMudar(e.target.value)}
          className="h-11 w-16 cursor-pointer rounded-lg border border-border bg-bg p-1"
        />
        {cor ? (
          <button
            type="button"
            onClick={() => aoMudar(undefined)}
            className="text-sm text-muted underline underline-offset-4"
          >
            {t('agendaCorDoEstilo')}
          </button>
        ) : (
          <span className="text-sm text-muted">{t('agendaUsandoCorEstilo')}</span>
        )}
      </div>
    </div>
  )
}

const ROTULO_CAMPO: Record<TipoCampo, keyof Dicionario> = {
  texto: 'campoTexto',
  textoLongo: 'campoTextoLongo',
  whatsapp: 'campoWhatsapp',
  email: 'campoEmail',
  numero: 'campoNumero',
  data: 'campoData',
  uma: 'campoUma',
  varias: 'campoVarias',
}

function EditorFormulario({
  itemId,
  dados,
  aoMudar,
}: {
  itemId: string
  dados: DadosItem
  aoMudar: (patch: Partial<DadosItem>) => void
}) {
  const t = useT()
  const campos = dados.campos ?? []
  const botaoPequeno = 'rounded-lg border border-border px-2 py-1 text-xs disabled:opacity-30'

  function mudarCampos(lista: CampoFormulario[]) {
    aoMudar({ campos: lista })
  }

  function mudarCampo(i: number, patch: Partial<CampoFormulario>) {
    mudarCampos(campos.map((c, j) => (j === i ? { ...c, ...patch } : c)))
  }

  function mover(i: number, passo: number) {
    const j = i + passo
    if (j < 0 || j >= campos.length) return
    const lista = [...campos]
    ;[lista[i], lista[j]] = [lista[j], lista[i]]
    mudarCampos(lista)
  }

  return (
    <div className="space-y-5">
      <div>
        <span className="block text-sm font-medium">{t('formularioPerguntas')}</span>
        {campos.length === 0 && (
          <p className="mt-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {t('formularioSemPerguntas')}
          </p>
        )}

        <ul className="mt-2 space-y-3">
          {campos.map((campo, i) => (
            <li key={campo.id} className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-muted">
                  {t('perguntaN', { n: i + 1 })}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={t('moverCima')}
                    disabled={i === 0}
                    onClick={() => mover(i, -1)}
                    className={botaoPequeno}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={t('moverBaixo')}
                    disabled={i === campos.length - 1}
                    onClick={() => mover(i, 1)}
                    className={botaoPequeno}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => mudarCampos(campos.filter((_, j) => j !== i))}
                    className="ml-1 text-sm text-red-600"
                  >
                    {t('remover')}
                  </button>
                </div>
              </div>

              <input
                aria-label={t('perguntaN', { n: i + 1 })}
                value={campo.rotulo}
                maxLength={120}
                placeholder="Qual serviço você procura?"
                onChange={(e) => mudarCampo(i, { rotulo: e.target.value })}
                className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-base outline-none focus:border-fg"
              />

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <select
                  aria-label={t('formularioFormato')}
                  value={campo.tipo}
                  onChange={(e) => mudarCampo(i, { tipo: e.target.value as TipoCampo })}
                  className="rounded-lg border border-border bg-bg px-3 py-2.5 text-base outline-none focus:border-fg"
                >
                  {TIPOS_CAMPO.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {t(ROTULO_CAMPO[tipo])}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={campo.obrigatorio}
                    onChange={(e) => mudarCampo(i, { obrigatorio: e.target.checked })}
                    className="size-4"
                  />
                  {t('formularioObrigatoria')}
                </label>
              </div>

              {(campo.tipo === 'uma' || campo.tipo === 'varias') && (
                <label className="mt-3 block text-sm font-medium">
                  {t('formularioOpcoes')}
                  {/* As linhas ficam como estao, vazias inclusive: filtrar aqui
                      impediria apertar Enter para comecar a proxima opcao. */}
                  <textarea
                    value={(campo.opcoes ?? []).join('\n')}
                    rows={3}
                    placeholder={'Corte\nBarba\nCorte + barba'}
                    onChange={(e) => mudarCampo(i, { opcoes: e.target.value.split('\n') })}
                    className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-base font-normal outline-none focus:border-fg"
                  />
                </label>
              )}
            </li>
          ))}
        </ul>

        {campos.length < MAX_CAMPOS && (
          <button
            type="button"
            onClick={() =>
              mudarCampos([
                ...campos,
                { id: novoIdCampo(), rotulo: '', tipo: 'texto', obrigatorio: false },
              ])
            }
            className="mt-3 w-full rounded-xl border border-dashed border-border px-4 py-2.5 text-sm text-muted"
          >
            {t('adicionarPergunta')}
          </button>
        )}
      </div>

      <div>
        <label htmlFor="formulario-fim" className="block text-sm font-medium">
          {t('formularioMensagemFim')}{' '}
          <span className="font-normal text-muted">{t('opcional')}</span>
        </label>
        <textarea
          id="formulario-fim"
          value={dados.mensagemFim ?? ''}
          rows={2}
          maxLength={300}
          placeholder={t('formularioMensagemPadrao')}
          onChange={(e) => aoMudar({ mensagemFim: e.target.value })}
          className="mt-2 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-fg"
        />
      </div>

      <CampoCor
        id="formulario-cor"
        valor={dados.corFundo}
        aoMudar={(corFundo) => aoMudar({ corFundo })}
      />

      <Link
        href={`/painel/respostas?f=${itemId}`}
        className="inline-block text-sm underline underline-offset-4"
      >
        {t('formularioVerRespostas')}
      </Link>
    </div>
  )
}

function EditorFaq({
  perguntas,
  aoMudar,
}: {
  perguntas: { p: string; r: string }[]
  aoMudar: (v: { p: string; r: string }[]) => void
}) {
  const t = useT()
  return (
    <div>
      <ul className="space-y-3">
        {perguntas.map((item, i) => (
          <li key={i} className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-muted">{t('perguntaN', { n: i + 1 })}</span>
              <button
                type="button"
                onClick={() => aoMudar(perguntas.filter((_, j) => j !== i))}
                className="text-sm text-red-600"
              >
                {t('remover')}
              </button>
            </div>
            <input
              aria-label={t('perguntaN', { n: i + 1 })}
              value={item.p}
              placeholder="Vocês entregam?"
              onChange={(e) =>
                aoMudar(perguntas.map((x, j) => (j === i ? { ...x, p: e.target.value } : x)))
              }
              className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-base outline-none focus:border-fg"
            />
            <textarea
              aria-label={t('perguntaN', { n: i + 1 })}
              value={item.r}
              rows={2}
              placeholder="Sim, em toda a Grande Florianópolis."
              onChange={(e) =>
                aoMudar(perguntas.map((x, j) => (j === i ? { ...x, r: e.target.value } : x)))
              }
              className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-base outline-none focus:border-fg"
            />
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => aoMudar([...perguntas, { p: '', r: '' }])}
        className="mt-3 w-full rounded-xl border border-dashed border-border px-4 py-2.5 text-sm text-muted"
      >
        {t('adicionarPergunta')}
      </button>
    </div>
  )
}
