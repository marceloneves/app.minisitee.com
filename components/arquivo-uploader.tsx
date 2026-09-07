'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/lib/i18n/contexto'
import { formatarBytes } from '@/lib/types'

const TAMANHO_MAXIMO = 20 * 1024 * 1024

export function ArquivoUploader({
  itemId,
  url,
  nome,
  tamanho,
  aoMudar,
}: {
  itemId: string
  url?: string
  nome?: string
  tamanho?: number
  aoMudar: (dados: {
    arquivoUrl?: string
    arquivoNome?: string
    arquivoTamanho?: number
  }) => void
}) {
  const t = useT()
  const [progresso, setProgresso] = useState<number | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function enviar(arquivo: File) {
    setErro(null)

    if (arquivo.size > TAMANHO_MAXIMO) {
      setErro(`O arquivo tem ${formatarBytes(arquivo.size)}. O limite é 20 MB.`)
      return
    }

    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setErro(t('sessaoExpirada'))
      return
    }

    const extensao = arquivo.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const caminho = `${session.user.id}/${itemId}/${crypto.randomUUID()}.${extensao}`

    setProgresso(0)

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open(
          'POST',
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/media/${caminho}`
        )
        xhr.setRequestHeader(
          'apikey',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
        xhr.setRequestHeader('x-upsert', 'true')
        xhr.setRequestHeader(
          'Content-Type',
          arquivo.type || 'application/octet-stream'
        )
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgresso(Math.round((e.loaded / e.total) * 100))
          }
        }
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(`Falhou (${xhr.status})`))
        xhr.onerror = () => reject(new Error('Falha de rede'))
        xhr.send(arquivo)
      })

      const { data } = supabase.storage.from('media').getPublicUrl(caminho)
      aoMudar({
        arquivoUrl: data.publicUrl,
        arquivoNome: arquivo.name,
        arquivoTamanho: arquivo.size,
      })
      setProgresso(null)
    } catch {
      setProgresso(null)
      setErro('Não foi possível enviar o arquivo.')
    }
  }

  return (
    <div>
      <span className="block text-sm font-medium">{t('arquivo')}</span>

      {url && nome ? (
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{nome}</span>
            {tamanho !== undefined && (
              <span className="block text-xs text-muted">
                {formatarBytes(tamanho)}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() =>
              aoMudar({
                arquivoUrl: undefined,
                arquivoNome: undefined,
                arquivoTamanho: undefined,
              })
            }
            className="shrink-0 text-sm text-red-600"
          >
            {t('remover')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={progresso !== null}
          className="mt-2 w-full rounded-xl border-2 border-dashed border-border px-4 py-6 text-sm text-muted disabled:opacity-50"
        >
          {progresso !== null
            ? t('enviandoPct', { n: progresso })
            : t('escolherArquivo')}
        </button>
      )}

      {progresso !== null && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
          <div className="h-full bg-fg" style={{ width: `${progresso}%` }} />
        </div>
      )}

      {erro && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {erro}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void enviar(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
