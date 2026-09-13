import 'server-only'

// Envio pelo Resend, direto na API HTTP: um POST so nao justifica o SDK.
export function emailConfigurado() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_REMETENTE)
}

export async function enviarEmail({
  para,
  assunto,
  texto,
  html,
}: {
  para: string
  assunto: string
  texto: string
  html: string
}) {
  if (!emailConfigurado()) return false

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_REMETENTE,
        to: [para],
        subject: assunto,
        text: texto,
        html,
      }),
    })

    if (!r.ok) {
      console.error('[email] resend recusou', r.status, (await r.text()).slice(0, 300))
      return false
    }
    return true
  } catch (e) {
    console.error('[email] falha ao enviar', (e as Error).message)
    return false
  }
}

export function escaparHtml(texto: string) {
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
