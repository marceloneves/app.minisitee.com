import { Capriola, Lora, Montserrat, Playfair_Display, Poppins } from 'next/font/google'

// Fontes que o dono pode escolher para o minisite (lib/estilo.ts). O next
// hospeda os arquivos junto do app. preload desligado: sem isso toda pagina,
// painel inclusive, baixaria as cinco; so o minisite que usa uma pede o arquivo.
const capriola = Capriola({ weight: '400', subsets: ['latin'], variable: '--fonte-capriola', preload: false })
const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--fonte-poppins',
  preload: false,
})
const montserrat = Montserrat({ subsets: ['latin'], variable: '--fonte-montserrat', preload: false })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--fonte-playfair', preload: false })
const lora = Lora({ subsets: ['latin'], variable: '--fonte-lora', preload: false })

export const variaveisDasFontes = [capriola, poppins, montserrat, playfair, lora]
  .map((f) => f.variable)
  .join(' ')
