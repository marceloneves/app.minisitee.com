import { spawn } from 'node:child_process'

// Sai por um processo separado para nao segurar a subida do app: o script
// espera o servidor responder antes de gravar, e isso leva alguns segundos.
if (process.env.HTML_DIR) {
  const filho = spawn(process.execPath, ['scripts/publicar-html.mjs'], {
    detached: true,
    stdio: 'ignore',
  })
  filho.unref()
}
