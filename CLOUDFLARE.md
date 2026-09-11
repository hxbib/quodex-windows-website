# Cloudflare — quodex.app/windows

This Worker is the Windows landing. The macOS landing stays in [hxbib/quodex-website](https://github.com/hxbib/quodex-website) on `/`.

Live: **https://quodex.app/windows**

## How a push deploys

GitHub is the origin. A push to `main` runs [.github/workflows/deploy.yml](.github/workflows/deploy.yml):

1. `npm ci`, tests, and `npm run build`
2. Built files are force-published to branch [`cf-live`](https://github.com/hxbib/quodex-windows-website/tree/cf-live)
3. The Worker on route `quodex.app/windows*` serves `cf-live`. Hashed `/assets/*` files cache in KV. HTML revalidates from GitHub so the next push goes live without a Cloudflare token.

No Cloudflare API token is required for that path.

## Optional: native Wrangler deploy

Add repository secrets:

- `CLOUDFLARE_API_TOKEN` — Workers Scripts Edit, Account Settings Read, Zone Workers Routes Edit on `quodex.app`
- `CLOUDFLARE_ACCOUNT_ID` — `3c3fe681053affe566cb197e28892790`

The same workflow then also runs `npx wrangler deploy`, which uploads Worker static assets from `wrangler.toml`.

Or connect Git in the dashboard: Workers → `quodex-windows-website` → Settings → Builds → Connect, after authorizing the Cloudflare GitHub App. The API cannot install that app.

Do **not** attach a Custom Domain for the whole zone — that would steal `quodex.app/`.

Route already live:

- Zone: `quodex.app`
- Route: `quodex.app/windows*`

More-specific Worker routes beat the macOS Worker Custom Domain, so `/` stays macOS and `/windows` is this site.

## Zone settings (quodex.app)

Already applied on the domain. Safe for both landings.

SSL/TLS

- Mode **Full (strict)**
- Always Use HTTPS **On**
- Minimum TLS **1.2**, TLS 1.3 **On**
- Automatic HTTPS Rewrites **On**
- HSTS **On**, max-age 12 months, Include subdomains **On**, Preload off until every hostname is HTTPS

Speed

- HTTP/3 **On**
- 0-RTT **Off**
- Brotli **On**
- Early Hints **On**
- Rocket Loader **Off**
- Auto Minify **Off**
- Polish / Mirage **Off**

Caching

- Caching Level **Standard**
- Browser Cache TTL **Respect Existing Headers**
- Development Mode **Off**

Security

- Security Level **Medium**
- Bot Fight Mode **On** (JS detection **Off** so it does not inject scripts that the landing CSP blocks)
- AI bots / AI training / AI search blocked
- WAF: Cloudflare Managed Ruleset **enabled**
- Email Obfuscation **Off**

Network

- HTTP/2 **On**
- WebSockets **On**
- gRPC **Off**
- Pseudo IPv4 **Off**

DNS

- Apex `quodex.app` stays orange-clouded on the macOS Worker Custom Domain
- Optional `www` → apex: Redirect Rule `www.quodex.app/*` 301 to `https://quodex.app/${1}`

## What you do not host here

The Windows `.exe` zip stays on GitHub Releases. Download links already fall back there.
