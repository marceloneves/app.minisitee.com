import { openSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { join } from 'node:path'

// Sai por um processo separado para nao segurar a subida do app: o script
// espera o servidor responder antes de gravar, e isso leva alguns segundos.
//
// A saida vai para um arquivo. Engolir isso ja custou caro: quando a geracao
// falhava, os minisites ficavam quebrados e nao havia onde olhar.
if (process.env.HTML_DIR) {
  const log = openSync(join(process.cwd(), 'publicar-html.log'), 'a')

  const filho = spawn(process.execPath, ['scripts/publicar-html.mjs'], {
    detached: true,
    stdio: ['ignore', log, log],
  })
  filho.unref()
}
