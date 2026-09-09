// Gera o HTML de todos os minisites de uma vez. Roda no fim de cada publicacao
// (o codigo mudou, entao o HTML de todo mundo esta velho) e serve para o
// primeiro carregamento, quando ainda nao existe arquivo nenhum.
//
//   HTML_DIR=/home/minisitee.com/public_html node scripts/publicar-html.mjs
import { readFile, mkdir, rename, writeFile } from 'node:fs/promises'
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

const resposta = await fetch(`${SUPABASE}/rest/v1/profiles?select=username`, {
  headers: { apikey: CHAVE, Authorization: `Bearer ${CHAVE}` },
})

if (!resposta.ok) {
  console.error(`Nao consegui listar os perfis (${resposta.status}).`)
  process.exit(1)
}

const perfis = await resposta.json()
await mkdir(DIR, { recursive: true })

let feitos = 0
for (const { username } of perfis) {
  if (!/^[a-z0-9_-]+$/.test(username ?? '')) continue

  const pagina = await fetch(`${ORIGEM}/${username}`, { cache: 'no-store' })
  if (!pagina.ok) {
    console.error(`${username}: ${pagina.status}`)
    continue
  }

  const destino = join(DIR, `${username}.html`)
  await writeFile(`${destino}.tmp`, await pagina.text(), 'utf8')
  await rename(`${destino}.tmp`, destino)
  feitos++
}

console.log(`HTML gerado para ${feitos} de ${perfis.length} minisites.`)
