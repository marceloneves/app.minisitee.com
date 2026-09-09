# minisitee

Catálogo em um link. Next.js 15 (App Router, Turbopack), Supabase e Stripe.

## Rodando local

```bash
npm install
cp .env.local.example .env.local   # preencha as chaves
npm run dev
```

O `next dev` e o `next build` gravam na mesma pasta `.next`, e um derruba o
outro. Para conferir um build com o servidor de desenvolvimento no ar:

```bash
NEXT_DIST_DIR=.next-build npm run build
```

## Domínios

São dois, servidos pelo mesmo app:

- `minisitee.com` — a landing (arquivos estáticos) e os perfis públicos
  (`minisitee.com/usuario`). É o valor de `NEXT_PUBLIC_SITE_URL`, usado no link
  público, no canonical e no OG.
- `app.minisitee.com` — o painel. É o `NEXT_PUBLIC_APP_URL`, usado na volta do
  Stripe e no link de recuperar senha. Vazio, cai na origem da requisição.

No domínio raiz, o LiteSpeed serve o arquivo quando ele existe em
`public_html` e repassa o resto para o app na `127.0.0.1:3001`
(regra em `public_html/.htaccess`).

## Publicando

Push na `main` → webhook do GitHub chama `deploy.php` → `deploy-minisitee.sh`,
que faz `fetch`, `reset --hard`, `npm install`, `npm run build` e
`pm2 restart app-minisitee`. O andamento fica em `deploy.log`, na raiz do
projeto no servidor.

Para publicar na mão, na VPS:

```bash
/usr/local/bin/deploy-minisitee.sh && tail -5 deploy.log
```

## Banco

Migrations em `supabase/migrations/`, aplicadas com `supabase db push` ou pelo
SQL editor do painel do Supabase.
