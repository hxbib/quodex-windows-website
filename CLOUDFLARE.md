# Cloudflare — quodex.app/windows

This Worker is the Windows landing. The macOS landing stays in [hxbib/quodex-website](https://github.com/hxbib/quodex-website) on `/`.

Live: **https://quodex.app/windows**

## How a push deploys

Cloudflare Workers Static Assets are the live origin. A push to `main` runs [.github/workflows/deploy.yml](.github/workflows/deploy.yml):

1. `npm ci`, tests, and `npm run build`
2. Publish `dist/` to the `cf-live` branch as a GitHub snapshot (not served)
3. `npx wrangler deploy` uploads the Worker and `dist/` together

If Wrangler cannot deploy, the workflow fails. There is no GitHub or KV fallback in the Worker.

Required repository secret:

- `CLOUDFLARE_API_TOKEN` — Workers Scripts Edit, Account Settings Read, Workers Assets, Zone Workers Routes Edit on `quodex.app`

Account id is already in `wrangler.toml`: `3c3fe681053affe566cb197e28892790`.

Do **not** attach a Custom Domain for the whole zone — that would steal `quodex.app/`.

Route already live:

- Zone: `quodex.app`
- Route: `quodex.app/windows*`

More-specific Worker routes beat the macOS Worker Custom Domain, so `/` stays macOS and `/windows` is this site.

Well-known files live in `public/` and ship with the Worker assets:

- `/windows/robots.txt`, `/windows/sitemap.xml`
- `/windows/llms.txt`, `/windows/llm.txt`, `/windows/humans.txt`
- `/windows/.well-known/security.txt` and `/windows/security.txt`
- Apex aliases on the same Worker: `/.well-known/security.txt`, `/security.txt`, `/llms.txt`, `/llm.txt`, `/humans.txt`, `/sitemap.xml`

Do not attach a Worker to `/robots.txt` — Cloudflare manages the zone robots file for AI crawlers.

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
- Bot Fight Mode **On**
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
- `www.quodex.app` is a proxied CNAME to apex. Redirect Rule: `www.quodex.app/*` 301 to `https://quodex.app${path}` (query preserved)

## What you do not host here

The Windows `.exe` zip stays on GitHub Releases. Download links already fall back there.
