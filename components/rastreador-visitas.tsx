'use client'

import { useEffect } from 'react'

// Conta a visita e os cliques nas ferramentas do minisite publico. Fica so na
// pagina publica: a previa do painel (Ver minisitee) usa o mesmo conteudo sem
// este componente, e o dono olhando o proprio minisite la nao conta.
//
// Cada ferramenta leva data-ferramenta com o id (minisitee-conteudo.tsx): um
// ouvinte so, no documento, descobre qual foi tocada.
export function RastreadorVisitas({ perfil }: { perfil: string }) {
  useEffect(() => {
    // Robo de teste e pre-carregamento do navegador nao sao visita.
    if (navigator.webdriver) return

    function enviar(dados: Record<string, string>) {
      const corpo = JSON.stringify({ p: perfil, ...dados })
      try {
        if (navigator.sendBeacon?.('/api/visita', corpo)) return
      } catch {
        // cai no fetch
      }
      void fetch('/api/visita', { method: 'POST', body: corpo, keepalive: true }).catch(() => {})
    }

    const params = new URLSearchParams(location.search)
    const marcador = params.get('ref') ?? params.get('utm_source') ?? ''
    enviar({ t: 'page_view', r: document.referrer, m: marcador })

    // O mesmo toque repetido em seguida (duplo clique, toque nervoso) conta uma vez.
    let ultimo = { id: '', em: 0 }
    function aoClicar(e: MouseEvent) {
      const alvo = e.target as Element | null
      const ferramenta = alvo?.closest?.('[data-ferramenta]')
      // So o que leva a algum lugar: link, ou abrir uma pergunta do FAQ.
      if (!ferramenta || !alvo?.closest('a, summary')) return
      const id = ferramenta.getAttribute('data-ferramenta') ?? ''
      const agora = Date.now()
      if (id === ultimo.id && agora - ultimo.em < 1500) return
      ultimo = { id, em: agora }
      enviar({ t: 'click', i: id })
    }

    document.addEventListener('click', aoClicar, { capture: true })
    return () => document.removeEventListener('click', aoClicar, { capture: true })
  }, [perfil])

  return null
}
