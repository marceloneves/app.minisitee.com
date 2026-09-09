// Todo build novo troca o nome dos arquivos em /_next e apaga os antigos. O
// HTML gravado dos minisites aponta para os velhos, entao depois de cada
// deploy ele precisa ser regerado — senao os minisites abrem sem estilo e sem
// foto. Deixar isso na mao do script de deploy ja quebrou a producao uma vez.
//
// O Next chama register() uma vez, quando o servidor sobe: e exatamente o
// momento depois do `pm2 restart`.
export async function register() {
  // O middleware roda no runtime edge, que nao tem child_process. O arquivo
  // com o codigo de verdade so e carregado no servidor Node.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  await import('./instrumentation.node')
}
