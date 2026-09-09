import { ImageResponse } from 'next/og'
import { buscarPagina } from '@/lib/catalogo'
import { DICIONARIOS, idiomaValido } from '@/lib/i18n/dicionarios'
import { enderecoPublico } from '@/lib/site'
import { ESTILOS, temaValido } from '@/lib/types'

// Sem esta imagem, um minisite sem avatar era compartilhado sem figura
// nenhuma: no WhatsApp o link virava um retangulo cinza. Aqui todo mundo
// ganha um cartao 1200x630 com o nome, o que faz e a cidade.
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// O alt do og:image e lido em voz alta em quem compartilha o link; sem isto
// ele seria um texto fixo igual para todo minisite.
export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const pagina = await buscarPagina(username)
  const nome = pagina?.profile?.display_name ?? username
  return [{ id: 'cartao', alt: nome, size, contentType }]
}

// O avatar fica de fora de proposito: e gravado em webp, e o gerador de
// imagem do Next nao decodifica webp. A inicial no circulo faz as vezes dele.
export default async function ImagemCompartilhamento({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const pagina = await buscarPagina(username)
  const profile = pagina?.profile

  const [, , superficie, marca] = ESTILOS.find(
    ([v]) => v === temaValido(profile?.theme)
  )!

  const nome = profile?.display_name ?? username
  const d = DICIONARIOS[idiomaValido(profile?.locale)]
  const local = profile?.city ? ` ${d.emCidade} ${profile.city}` : ''
  const linha = profile?.headline ? `${profile.headline}${local}` : local.trim()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: superficie,
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '40px' }}>
          <div
            style={{
              width: '160px',
              height: '160px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '80px',
              background: marca,
              color: '#ffffff',
              fontSize: '80px',
              fontWeight: 700,
            }}
          >
            {nome.trim().charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '820px' }}>
            <div style={{ fontSize: '68px', fontWeight: 700, color: '#18181b', lineHeight: 1.1 }}>
              {nome}
            </div>
            {linha && (
              <div style={{ marginTop: '16px', fontSize: '38px', color: '#52525b' }}>
                {linha}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `4px solid ${marca}`,
            paddingTop: '32px',
            fontSize: '34px',
            color: marca,
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex' }}>{enderecoPublico(username)}</div>
        </div>
      </div>
    ),
    size
  )
}
