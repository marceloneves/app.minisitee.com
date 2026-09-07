'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { moverFoto, registrarFoto, removerFoto } from '@/lib/actions/photos'
import { MAX_FOTOS } from '@/lib/constants'
import { useT } from '@/lib/i18n/contexto'
import { prepararFoto } from '@/lib/image'
import { createClient } from '@/lib/supabase/client'

export type Foto = { id: string; url: string; position: number }

type EmAndamento = { chave: string; nome: string; progresso: number; erro?: string }

export function PhotoUploader({
  itemId,
  iniciais,
}: {
  itemId: string
  iniciais: Foto[]
}) {
  const t = useT()
  const [fotos, setFotos] = useState<Foto[]>(iniciais)
  const [fila, setFila] = useState<EmAndamento[]>([])
  const [arrastando, setArrastando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const restantes = MAX_FOTOS - fotos.length

  async function enviar(arquivos: File[]) {
    setErro(null)

    const imagens = arquivos.filter((a) => a.type.startsWith('image/'))
    if (imagens.length === 0) return

    if (imagens.length > restantes) {
      setErro(
        `Você pode adicionar mais ${restantes} foto${restantes === 1 ? '' : 's'}. Máximo de ${MAX_FOTOS} por item.`
      )
    }

    const lote = imagens.slice(0, Math.max(restantes, 0))
    if (lote.length === 0) return

    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setErro(t('sessaoExpirada'))
      return
    }

    for (const arquivo of lote) {
      const chave = `${arquivo.name}-${crypto.randomUUID()}`
      setFila((f) => [...f, { chave, nome: arquivo.name, progresso: 0 }])

      try {
        const webp = await prepararFoto(arquivo)
        const caminho = `${session.user.id}/${itemId}/${crypto.randomUUID()}.webp`

        await enviarComProgresso(webp, caminho, session.access_token, (p) =>
          setFila((f) =>
            f.map((i) => (i.chave === chave ? { ...i, progresso: p } : i))
          )
        )

        const { data } = supabase.storage.from('media').getPublicUrl(caminho)
        const r = await registrarFoto(itemId, data.publicUrl)

        if ('erro' in r && r.erro) {
          await supabase.storage.from('media').remove([caminho])
          setFila((f) =>
            f.map((i) => (i.chave === chave ? { ...i, erro: r.erro } : i))
          )
          continue
        }

        if ('foto' in r && r.foto) {
          setFotos((atual) => [...atual, r.foto as Foto])
        }
        setFila((f) => f.filter((i) => i.chave !== chave))
      } catch {
        setFila((f) =>
          f.map((i) => (i.chave === chave ? { ...i, erro: 'Falhou' } : i))
        )
      }
    }
  }

  async function remover(id: string) {
    const antes = fotos
    setFotos((f) => f.filter((x) => x.id !== id))
    const r = await removerFoto(id)
    if ('erro' in r && r.erro) {
      setFotos(antes)
      setErro(r.erro)
    }
  }

  async function mover(id: string, direcao: 'antes' | 'depois') {
    const i = fotos.findIndex((f) => f.id === id)
    const alvo = direcao === 'antes' ? i - 1 : i + 1
    if (i === -1 || alvo < 0 || alvo >= fotos.length) return

    const antes = fotos
    const nova = [...fotos]
    ;[nova[i], nova[alvo]] = [nova[alvo], nova[i]]
    setFotos(nova)

    const r = await moverFoto(id, direcao)
    if ('erro' in r && r.erro) {
      setFotos(antes)
      setErro(r.erro)
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault()
          setArrastando(false)
          void enviar(Array.from(e.dataTransfer.files))
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          arrastando ? 'border-fg bg-surface' : 'border-border'
        }`}
      >
        <p className="text-sm font-medium">{t('arrasteFotos')}</p>
        <p className="mt-1 text-xs text-muted">
          {restantes > 0
            ? t('ateNFotos', { n: restantes })
            : t('limiteFotos', { n: MAX_FOTOS })}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            void enviar(Array.from(e.target.files ?? []))
            e.target.value = ''
          }}
        />
      </div>

      {erro && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {erro}
        </p>
      )}

      {fila.length > 0 && (
        <ul className="mt-4 space-y-2">
          {fila.map((item) => (
            <li key={item.chave} className="text-xs">
              <div className="flex justify-between gap-2">
                <span className="truncate text-muted">{item.nome}</span>
                <span className={item.erro ? 'text-red-600' : 'text-muted'}>
                  {item.erro ?? `${item.progresso}%`}
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full transition-[width] ${item.erro ? 'bg-red-500' : 'bg-fg'}`}
                  style={{ width: `${item.erro ? 100 : item.progresso}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {fotos.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fotos.map((foto, i) => (
            <li
              key={foto.id}
              className="relative aspect-4/3 overflow-hidden rounded-xl border border-border bg-surface"
            >
              <Image
                src={foto.url}
                alt=""
                fill
                sizes="(min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />

              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-md bg-fg px-1.5 py-0.5 text-[10px] font-semibold text-bg">
                  {t('capa')}
                </span>
              )}

              <button
                type="button"
                aria-label={t('removerFoto')}
                onClick={() => void remover(foto.id)}
                className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-xs text-white"
              >
                ✕
              </button>

              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
                <button
                  type="button"
                  aria-label={t('moverTras')}
                  disabled={i === 0}
                  onClick={() => void mover(foto.id, 'antes')}
                  className="rounded-md bg-black/60 px-2 py-0.5 text-xs text-white disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label={t('moverFrente')}
                  disabled={i === fotos.length - 1}
                  onClick={() => void mover(foto.id, 'depois')}
                  className="rounded-md bg-black/60 px-2 py-0.5 text-xs text-white disabled:opacity-30"
                >
                  →
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function enviarComProgresso(
  blob: Blob,
  caminho: string,
  token: string,
  aoProgredir: (pct: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(
      'POST',
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/media/${caminho}`
    )
    xhr.setRequestHeader(
      'apikey',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('x-upsert', 'true')
    xhr.setRequestHeader('Content-Type', 'image/webp')

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        aoProgredir(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        aoProgredir(100)
        resolve()
      } else {
        reject(new Error(`Upload falhou (${xhr.status})`))
      }
    }
    xhr.onerror = () => reject(new Error('Falha de rede'))
    xhr.send(blob)
  })
}
