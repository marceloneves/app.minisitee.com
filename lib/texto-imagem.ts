// alt e title das imagens enviadas pelo dono: o nome do servico e, quando
// existe, a descricao. Leitor de tela e buscador leem isto, entao fica curto.
const LIMITE = 150

export function textoDaImagem(titulo?: string | null, descricao?: string | null) {
  const nome = (titulo ?? '').trim()
  const texto = (descricao ?? '').replace(/\s+/g, ' ').trim()
  const resumo =
    texto.length > LIMITE ? `${texto.slice(0, LIMITE).replace(/\s+\S*$/, '')}…` : texto

  // O editor grava "Sem título" quando o campo fica vazio.
  if (!nome || nome === 'Sem título') return resumo
  return resumo ? `${nome} – ${resumo}` : nome
}
