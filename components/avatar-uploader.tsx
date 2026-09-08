'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { definirAvatar, removerAvatar } from '@/lib/actions/profile'
import { useT } from '@/lib/i18n/contexto'
import { prepararAvatar } from '@/lib/image'
import { createClient } from '@/lib/supabase/client'

export function AvatarUploader({ inicial }: { inicial: string | null }) {
  const t = useT()
  const [url, setUrl] = useState(inicial)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function enviar(arquivo: File | undefined) {
    if (!arquivo || !arquivo.type.startsWith('image/')) return

    setErro(null)
    setOcupado(true)

    const supabase = createClient()

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setErro(t('sessaoExpirada'))
        return
      }

      const webp = await prepararAvatar(arquivo)
      const caminho = `${session.user.id}/perfil/${crypto.randomUUID()}.webp`

      const { error } = await supabase.storage
        .from('media')
        .upload(caminho, webp, { contentType: 'image/webp' })

      if (error) {
        setErro(t('imagemFalhou'))
        return
      }

      const { data } = supabase.storage.from('media').getPublicUrl(caminho)
      const r = await definirAvatar(data.publicUrl)

      if ('erro' in r && r.erro) {
        await supabase.storage.from('media').remove([caminho])
        setErro(r.erro)
        return
      }

      setUrl(data.publicUrl)
    } catch {
      setErro(t('imagemFalhou'))
    } finally {
      setOcupado(false)
    }
  }

  async function remover() {
    setErro(null)
    setOcupado(true)
    const r = await removerAvatar()
    if ('erro' in r && r.erro) setErro(r.erro)
    else setUrl(null)
    setOcupado(false)
  }

  return (
    <div>
      <span className="block text-sm font-medium">{t('fotoPerfil')}</span>

      <div className="mt-2 flex items-center gap-4">
        <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface">
          {url ? (
            <Image
              src={url}
              alt=""
              width={80}
              height={80}
              sizes="80px"
              className="size-20 object-cover"
            />
          ) : (
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-8 text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8.5" r="3.5" />
              <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
            </svg>
          )}
        </span>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={ocupado}
            className="rounded-xl border border-border px-3 py-2 text-sm font-medium disabled:opacity-60"
          >
            {ocupado ? t('enviando') : url ? t('trocarImagem') : t('enviarImagem')}
          </button>

          {url && (
            <button
              type="button"
              onClick={() => void remover()}
              disabled={ocupado}
              className="rounded-xl px-3 py-2 text-sm text-muted underline underline-offset-4 disabled:opacity-60"
            >
              {t('removerImagem')}
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            void enviar(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      <p className="mt-2 text-xs text-muted">{t('fotoPerfilAjuda')}</p>

      {erro && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {erro}
        </p>
      )}
    </div>
  )
}
