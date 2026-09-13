'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { PhotoUploader, type Foto } from '@/components/photo-uploader'
import { ArquivoUploader } from '@/components/arquivo-uploader'
import { RedeIcone } from '@/components/rede-icone'
import { useIdioma, useT } from '@/lib/i18n/contexto'
import { DIAS, ROTULO_STATUS, TIPOS } from '@/lib/i18n/dicionarios'
import { excluirItem, salvarItem, type PatchItem } from '@/lib/actions/items'
import { currencyToCents, maskCurrency } from '@/lib/mask'
import { slugify } from '@/lib/slug'
import {
  DIAS_SEMANA,
  REDES,
  STATUS_ITEM,
  horarioPadrao,
  type DadosItem,
  type TipoItem,
} from '@/lib/types'
import { CampoTelefone } from '@/components/campo-telefone'
import { QrCode, urlDoQrCode } from '@/components/qr-code'
import { ANTECEDENCIAS, DIAS_A_FRENTE, DURACOES, configAgenda } from '@/lib/agenda'

export type ItemForm = {
  id: string
  kind: TipoItem
  title: string
  url: string
  whatsappMessage: string
  dados: DadosItem
  slug: string
  description: string
  category: string
  status: string
  price: string
  priceNote: string
  location: string
}

type Estado = 'limpo' | 'sujo' | 'salvando' | 'salvo' | 'erro'

export function ItemEditor({
  inicial,
  username,
  fotosIniciais,
  slugManualInicial,
  ehNovo,
}: {
  inicial: ItemForm
  username: string
  fotosIniciais: Foto[]
  slugManualInicial: boolean
  ehNovo: boolean
}) {
  const t = useT()
  const idioma = useIdioma()
  const router = useRouter()
  const [form, setForm] = useState(inicial)
  const [estado, setEstado] = useState<Estado>('limpo')
  const [erro, setErro] = useState<string | null>(null)
  const [slugManual, setSlugManual] = useState(slugManualInicial)

  const pedido = useRef(0)

  const salvar = useCallback(async (atual: ItemForm) => {
    const id = ++pedido.current
    setEstado('salvando')

    const patch: PatchItem =
      atual.kind === 'produto'
        ? {
            title: atual.title.trim() || 'Sem título',
            slug: atual.slug,
            description: atual.description.trim() || null,
            category: atual.category.trim() || null,
            status: atual.status,
            price_cents: currencyToCents(atual.price),
            price_note: atual.priceNote.trim() || null,
            location: atual.location.trim() || null,
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
              }
            : {
                title: atual.title.trim() || 'Sem título',
                status: atual.status,
                data: atual.dados,
              }

    const r = await salvarItem(atual.id, patch)
    if (id !== pedido.current) return

    if ('erro' in r && r.erro) {
      setEstado('erro')
      setErro(r.erro)
      return
    }

    setErro(null)
    setEstado('salvo')
    router.push('/painel')
    router.refresh()
  }, [router])

  useEffect(() => {
    if (estado !== 'sujo') return

    function avisar(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [estado])

  // Um item nasce gravado no banco (o upload de foto precisa do id).
  // Cancelar a criação tem que apagar esse rascunho; cancelar a edição
  // de um item que já existia só volta sem salvar.
  function cancelar() {
    if (ehNovo && estado !== 'salvo') {
      setEstado('salvando')
      void excluirItem(form.id).then(() => {
        router.push('/painel')
        router.refresh()
      })
      return
    }
    router.push('/painel')
  }

  function mudarDados(patch: Partial<DadosItem>) {
    setEstado('sujo')
    setForm((f) => ({ ...f, dados: { ...f.dados, ...patch } }))
  }

  function mudar<K extends keyof ItemForm>(campo: K, valor: ItemForm[K]) {
    setEstado('sujo')
    setForm((f) => {
      const proximo = { ...f, [campo]: valor }
      if (campo === 'title' && !slugManual) {
        proximo.slug = slugify(String(valor)) || 'item'
      }
      return proximo
    })
  }

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg/90 px-4 py-2 backdrop-blur">
        <span className="text-xs text-muted">{TIPOS[idioma][form.kind].nome}</span>
        <div className="flex items-center gap-3">
          <IndicadorSalvamento estado={estado} erro={erro} />

          <button
            type="button"
            disabled={estado === 'salvando'}
            onClick={cancelar}
            className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {t('cancelar')}
          </button>

          <button
            type="button"
            onClick={() => void salvar(form)}
            disabled={estado === 'salvando' || estado === 'limpo' || estado === 'salvo'}
            className="rounded-lg bg-brand px-4 py-1.5 text-sm font-medium text-brand-fg disabled:opacity-40"
          >
            {estado === 'salvando' ? t('salvando') : t('salvar')}
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-6">
        {form.status === 'rascunho' && (
          <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
{t('avisoRascunho')}
          </p>
        )}
        <Secao titulo={t('basico')}>
          <Texto
            id="titulo"
            rotulo={
              form.kind === 'produto' || form.kind === 'qrcode' || form.kind === 'agenda'
                ? t('titulo')
                : t('textoBotao')
            }
            valor={form.title}
            aoMudar={(v) => mudar('title', v)}
            placeholder={
              form.kind === 'produto'
                ? 'O que você está oferecendo'
                : form.kind === 'whatsapp'
                  ? 'Fazer meu pedido'
                  : form.kind === 'qrcode'
                    ? 'Escaneie para ver o cardápio'
                    : form.kind === 'agenda'
                      ? 'Agende seu horário'
                      : 'Ver meu Instagram'
            }
          />

          {form.kind === 'link' && (
            <Texto
              id="url"
              rotulo={t('enderecoSite')}
              valor={form.url}
              aoMudar={(v) => mudar('url', v)}
              placeholder="https://instagram.com/seuperfil"
            />
          )}

          {form.kind === 'qrcode' && (
            <div>
              <Texto
                id="url"
                rotulo={t('enderecoSite')}
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

          {form.kind === 'faq' && (
            <EditorFaq
              perguntas={form.dados.perguntas ?? []}
              aoMudar={(perguntas) => mudarDados({ perguntas })}
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

          <div className={form.kind === 'produto' ? '' : 'hidden'}>
            <label htmlFor="slug" className="block text-sm font-medium">
              {t('enderecoPagina')}
            </label>
            <input
              id="slug"
              value={form.slug}
              onChange={(e) => {
                setSlugManual(true)
                mudar('slug', slugify(e.target.value))
              }}
              className="mt-2 w-full rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-fg"
            />
            <p className="mt-2 break-all text-xs text-muted">
              minisitee.com/{username}/
              <span className="font-medium text-fg">{form.slug}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {form.kind === 'produto' && (
              <Texto
                id="categoria"
                rotulo={t('categoria')}
                opcional
                valor={form.category}
                aoMudar={(v) => mudar('category', v)}
                placeholder="Bolos, Consultoria, Camisetas..."
              />
            )}
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
                {STATUS_ITEM.map(([v]) => (
                  <option key={v} value={v}>
                    {ROTULO_STATUS[idioma][v]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Secao>

        <Secao titulo={t('valor')} somenteProduto kind={form.kind}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="preco" className="block text-sm font-medium">
                {t('preco')} <span className="font-normal text-muted">{t('opcional')}</span>
              </label>
              <div className="mt-2 flex items-center rounded-xl border border-border bg-bg focus-within:border-fg">
                <span className="pl-4 text-sm text-muted">R$</span>
                <input
                  id="preco"
                  value={form.price}
                  inputMode="numeric"
                  placeholder="0,00"
                  onChange={(e) => mudar('price', maskCurrency(e.target.value))}
                  className="w-full bg-transparent px-2 py-3 text-base outline-none"
                />
              </div>
              <p className="mt-2 text-xs text-muted">
                {t('precoVazio')}
              </p>
            </div>

            <Texto
              id="nota-preco"
              rotulo={t('complementoPreco')}
              opcional
              valor={form.priceNote}
              aoMudar={(v) => mudar('priceNote', v)}
              placeholder="por hora, /mês, a partir de"
            />
          </div>
        </Secao>

        <Secao titulo={t('localizacao')} somenteProduto kind={form.kind}>
          <Texto
            id="local"
            rotulo={t('onde')}
            opcional
            valor={form.location}
            aoMudar={(v) => mudar('location', v)}
            placeholder="Centro, Florianópolis — ou Atendimento online"
          />
        </Secao>

        <Secao titulo={t('descricao')} somenteProduto kind={form.kind}>
          <textarea
            id="descricao"
            value={form.description}
            onChange={(e) => mudar('description', e.target.value)}
            rows={6}
            placeholder="Conte o que faz esse item valer a mensagem."
            className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-base outline-none focus:border-fg"
          />
        </Secao>

        <Secao titulo={t('fotos')} visivelEm={['produto', 'galeria']} kind={form.kind}>
          <PhotoUploader itemId={form.id} iniciais={fotosIniciais} />
        </Secao>
      </div>
    </div>
  )
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
  if (estado === 'sujo') {
    return <span className="text-xs text-amber-600">{t('naoSalvo')}</span>
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
  titulo: string
  children: React.ReactNode
  somenteProduto?: boolean
  visivelEm?: TipoItem[]
  kind?: TipoItem
}) {
  if (visivelEm && kind && !visivelEm.includes(kind)) return null
  if (somenteProduto && kind !== 'produto') return null
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-muted">{titulo}</h2>
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

      <Link href="/painel/agenda" className="inline-block text-sm underline underline-offset-4">
        {t('agendaVerCompromissos')}
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
