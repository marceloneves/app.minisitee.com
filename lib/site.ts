// Os perfis publicos moram em minisitee.com e o painel em app.minisitee.com.
// Os dois dominios caem no mesmo app, entao a diferenca so aparece nos links
// que a gente escreve na mao: um link relativo fica no dominio em que a pessoa
// ja esta, e no painel isso e o dominio errado.
const PADRAO = 'https://minisitee.com'

function semBarra(url: string) {
  return url.replace(/\/+$/, '')
}

// Onde os perfis sao servidos: usado em link publico, canonical e OG.
export function basePublica() {
  return semBarra(process.env.NEXT_PUBLIC_SITE_URL ?? PADRAO)
}

export function urlPublica(username: string) {
  return `${basePublica()}/${username}`
}

// Sem o protocolo, para mostrar na tela.
export function enderecoPublico(username: string) {
  return `${basePublica().replace(/^https?:\/\//, '')}/${username}`
}

// Onde o painel responde: volta do Stripe, link de recuperar senha. Se nao
// estiver configurado, a origem da requisicao ja e o dominio certo.
export function basePainel(origem?: string) {
  return semBarra(process.env.NEXT_PUBLIC_APP_URL ?? origem ?? basePublica())
}
