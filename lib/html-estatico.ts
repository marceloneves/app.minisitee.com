import 'server-only'
import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

// O link publico nao pode consultar o banco a cada visita. Quando o minisite
// muda, a pagina e gravada como HTML na pasta da landing e o proprio servidor
// web entrega o arquivo: visita nenhuma chega no app nem no Postgres.
//
// HTML_DIR vazio (desenvolvimento) desliga a geracao e nada muda.
const DIR = process.env.HTML_DIR
const ORIGEM = process.env.HTML_ORIGEM ?? 'http://127.0.0.1:3001'

// Uma pasta por minisite: minisites/<username>/index.html. Assim cada um fica
// isolado e pode ganhar arquivos proprios depois.
function pastaDe(username: string) {
  // username so tem [a-z0-9_-], mas o caminho vem de dado do banco: barra ou
  // ponto-ponto aqui sairiam da pasta.
  if (!/^[a-z0-9_-]+$/.test(username)) return null
  return join(DIR!, username)
}

export async function publicarHtml(username: string) {
  if (!DIR) return

  const pasta = pastaDe(username)
  if (!pasta) return
  const destino = join(pasta, 'index.html')

  try {
    const resposta = await fetch(`${ORIGEM}/${username}`, {
      headers: { 'x-html-estatico': '1' },
      cache: 'no-store',
    })

    if (!resposta.ok) {
      // Perfil apagado ou fora do ar: tira o arquivo em vez de deixar o
      // conteudo velho servindo para sempre.
      if (resposta.status === 404) await removerHtml(username)
      return
    }

    const html = await resposta.text()
    await mkdir(pasta, { recursive: true })

    // Grava em arquivo temporario e renomeia: quem pedir a pagina no meio da
    // troca recebe a versao antiga inteira, nunca um HTML pela metade.
    const temporario = `${destino}.tmp`
    await writeFile(temporario, html, 'utf8')
    await rename(temporario, destino)
  } catch {
    // Falhar aqui nao pode derrubar o salvamento: a pagina continua sendo
    // montada pelo app ate a proxima publicacao.
  }
}

export async function removerHtml(username: string) {
  if (!DIR) return
  const pasta = pastaDe(username)
  if (!pasta) return
  await rm(pasta, { force: true, recursive: true }).catch(() => {})
}
