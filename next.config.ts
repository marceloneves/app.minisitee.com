import type { NextConfig } from 'next'

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined

const nextConfig: NextConfig = {
  // O LiteSpeed e a Cloudflare comprimem na frente. Se o Next comprimir
  // tambem, a resposta chega com gzip duplo e o navegador nao le.
  compress: false,
  // Permite conferir o build sem derrubar o `next dev`, que serve da mesma
  // pasta: NEXT_DIST_DIR=.next-build npm run build.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: 'https',
            hostname: supabaseHost,
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
  },
}

export default nextConfig
