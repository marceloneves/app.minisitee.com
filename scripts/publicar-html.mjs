// Gera o HTML de todos os minisites de uma vez. Roda no fim de cada publicacao
// (o codigo mudou, entao o HTML de todo mundo esta velho) e serve para o
// primeiro carregamento, quando ainda nao existe arquivo nenhum.
//
//   HTML_DIR=/home/minisitee.com/public_html node scripts/publicar-html.mjs
import { readFile, mkdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { rmSync } from 'node:fs'
import { join } from 'node:path'

async function carregarEnv() {
  for (const arquivo of ['.env.local', '.env']) {
    try {
      const texto = await readFile(arquivo, 'utf8')
      for (const linha of texto.split('\n')) {
        const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
        if (m && !process.env[m[1]]) {
          process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
        }
      }
    } catch {
      // arquivo ausente e normal
    }
  }
}

await carregarEnv()

const DIR = process.env.HTML_DIR
const ORIGEM = process.env.HTML_ORIGEM ?? 'http://127.0.0.1:3001'
const SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL
const CHAVE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!DIR) {
  console.log('HTML_DIR nao definido: nada a gerar.')
  process.exit(0)
}
if (!SUPABASE || !CHAVE) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

// O app chama este script sozinho toda vez que sobe (instrumentation.ts).
// Se o pm2 estiver reiniciando em sequencia, uma execucao ja em andamento
// segura as outras: sem isso, uma sequencia de restarts empilharia copias
// gravando os mesmos arquivos ao mesmo tempo.
const TRAVA = join(DIR, '.publicando')

try {
  const { mtimeMs } = await stat(TRAVA)
  const minutos = (Date.now() - mtimeMs) / 60000

  // Uma trava velha e sinal de rodada que morreu no meio, nao de rodada em
  // andamento: seguir em frente e melhor do que deixar o site quebrado.
  if (minutos >= 0 && minutos < 2) {
    console.log(`Outra publicacao comecou ha ${minutos.toFixed(1)} min. Saindo.`)
    process.exit(0)
  }
  console.log(`Trava de ${minutos.toFixed(0)} min ignorada: rodada anterior morreu.`)
} catch {
  // sem trava e o caso normal
}

await mkdir(DIR, { recursive: true })
await writeFile(TRAVA, String(Date.now()), 'utf8')

// Chamado logo depois do `pm2 restart`, o app ainda esta subindo. Sem esperar,
// o script gravaria o HTML do build velho — ou nada — e os minisites ficariam
// apontando para arquivos /_next que o build novo ja apagou.
async function esperarApp() {
  for (let tentativa = 1; tentativa <= 30; tentativa++) {
    try {
      const r = await fetch(ORIGEM, { cache: 'no-store' })
      if (r.ok || r.status === 404) return true
    } catch {
      // ainda nao esta escutando
    }
    await new Promise((ok) => setTimeout(ok, 2000))
  }
  return false
}

if (!(await esperarApp())) {
  console.error(`O app nao respondeu em ${ORIGEM}. Nada foi gerado.`)
  process.exit(1)
}

const resposta = await fetch(`${SUPABASE}/rest/v1/profiles?select=username`, {
  headers: { apikey: CHAVE, Authorization: `Bearer ${CHAVE}` },
})

if (!resposta.ok) {
  console.error(`Nao consegui listar os perfis (${resposta.status}).`)
  process.exit(1)
}

const perfis = await resposta.json()

// Qualquer saida daqui para baixo tira a trava: sem isto, um erro no meio
// deixaria o proximo restart preso.
process.on('exit', () => {
  try {
    rmSync(TRAVA, { force: true })
  } catch {
    // nada a fazer no encerramento
  }
})

let feitos = 0
for (const { username } of perfis) {
  if (!/^[a-z0-9_-]+$/.test(username ?? '')) continue

  const pagina = await fetch(`${ORIGEM}/${username}`, { cache: 'no-store' })
  if (!pagina.ok) {
    console.error(`${username}: ${pagina.status}`)
    continue
  }

  const pasta = join(DIR, username)
  await mkdir(pasta, { recursive: true })
  const destino = join(pasta, 'index.html')
  await writeFile(`${destino}.tmp`, await pagina.text(), 'utf8')
  await rename(`${destino}.tmp`, destino)
  feitos++
}

await rm(TRAVA, { force: true })

console.log(
  `[${new Date().toISOString()}] HTML gerado para ${feitos} de ${perfis.length} minisites.`
)
