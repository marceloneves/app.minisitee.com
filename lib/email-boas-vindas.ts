import 'server-only'
import { enviarEmail, escaparHtml } from '@/lib/email'
import { DICIONARIOS, traduzir, type Idioma } from '@/lib/i18n/dicionarios'
import { basePainel, enderecoPublico, urlPublica } from '@/lib/site'

// Sai quando a pessoa termina o cadastro e escolhe o endereco: so ai existe o
// minisitee para mandar o link. Falhar aqui nunca impede o cadastro.
export async function enviarBoasVindas({
  email,
  nome,
  username,
  idioma,
}: {
  email: string
  nome: string
  username: string
  idioma: Idioma
}) {
  const d = DICIONARIOS[idioma]
  const link = urlPublica(username)
  const endereco = enderecoPublico(username)
  const painel = `${basePainel()}/painel`

  const ola = traduzir(d, 'boasVindasOla', { nome })
  const texto = traduzir(d, 'boasVindasTexto')
  const proximo = traduzir(d, 'boasVindasProximo')
  const botao = traduzir(d, 'boasVindasBotao')
  const rodape = traduzir(d, 'boasVindasRodape')

  return enviarEmail({
    para: email,
    assunto: traduzir(d, 'boasVindasAssunto'),
    texto: `${ola}\n\n${texto}\n\n${link}\n\n${proximo}\n${painel}\n\n${rodape}`,
    html: `<div style="font-family:system-ui,sans-serif;color:#18181b;max-width:480px">
<p style="font-size:18px;font-weight:600;margin:0 0 12px">${escaparHtml(ola)}</p>
<p style="font-size:16px;line-height:1.5">${escaparHtml(texto)}</p>
<p style="margin:20px 0"><a href="${link}" style="font-size:18px;font-weight:700;color:#18181b">${escaparHtml(endereco)}</a></p>
<p style="font-size:16px;line-height:1.5">${escaparHtml(proximo)}</p>
<p style="margin:24px 0"><a href="${painel}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:12px">${escaparHtml(botao)}</a></p>
<p style="font-size:13px;color:#71717a">${escaparHtml(rodape)}</p>
</div>`,
  })
}
