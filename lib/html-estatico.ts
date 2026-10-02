import 'server-only'
import { spawn } from 'node:child_process'
import { createHmac } from 'node:crypto'
import { openSync } from 'node:fs'
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

// Quem salva dispara o mesmo script que gera o HTML no deploy, so para este
// minisite. Gravar de dentro do app funcionava no computador e falhava calado
// em producao; o script e o caminho que ja funciona la, le o .env.local
// sozinho e deixa o resultado em publicar-html.log. Sai em processo separado
// e o salvamento nao espera: quando o script pede a pagina, o salvamento ja
// terminou e a pagina sai com o que acabou de ser salvo.
//
// Sem HTML_DIR (o app rodando no computador), o arquivo nao mora aqui: mora na
// VPS. Mas o banco e o mesmo de producao, entao salvar no localhost mudava o
// minisite no banco e deixava o HTML do ar velho. Nesse caso o pedido vai para
// a producao, que gera o arquivo la (app/api/publicar/route.ts).
export async function agendarPublicacao(username: string) {
  if (!/^[a-z0-9_-]+$/.test(username)) return
  if (DIR) gerarNestaMaquina(username)
  else await pedirParaProducao(username)
}

const PRODUCAO = process.env.PUBLICAR_REMOTO ?? 'https://minisitee.com'

// Assinado com a chave de servico do Supabase, que o computador e a VPS ja
// tem: so quem tem a chave consegue mandar a producao regerar um minisite.
export function assinatura(username: string, quando: string) {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!chave) return null
  return createHmac('sha256', chave).update(`publicar:${username}:${quando}`).digest('hex')
}

async function pedirParaProducao(username: string) {
  const quando = String(Date.now())
  const assinado = assinatura(username, quando)
  if (!assinado) return

  try {
    const r = await fetch(`${PRODUCAO}/api/publicar`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, quando, assinatura: assinado }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    if (!r.ok) console.error(`[html-estatico] ${username}: a producao respondeu ${r.status}`)
  } catch (erro) {
    console.error(`[html-estatico] ${username}: nao consegui avisar a producao`, erro)
  }
}

export function gerarNestaMaquina(username: string) {
  if (!DIR || !/^[a-z0-9_-]+$/.test(username)) return

  try {
    const log = openSync(join(process.cwd(), 'publicar-html.log'), 'a')
    const filho = spawn(process.execPath, ['scripts/publicar-html.mjs', username], {
      cwd: process.cwd(),
      detached: true,
      stdio: ['ignore', log, log],
    })
    filho.unref()
  } catch (erro) {
    console.error(`[html-estatico] ${username}: nao consegui iniciar o script`, erro)
  }
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
      console.error(`[html-estatico] ${username}: a pagina respondeu ${resposta.status}`)
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
  } catch (erro) {
    // Falhar aqui nao pode derrubar o salvamento, mas precisa aparecer no log
    // do pm2: sem isso o minisite fica velho sem ninguem saber por que.
    console.error(`[html-estatico] ${username}: nao gravou o HTML`, erro)
  }
}

export async function removerHtml(username: string) {
  if (!DIR) return
  const pasta = pastaDe(username)
  if (!pasta) return
  await rm(pasta, { force: true, recursive: true }).catch(() => {})
}
