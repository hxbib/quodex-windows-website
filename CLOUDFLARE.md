# Cloudflare — quodex.app/windows

This Worker is the Windows landing. The macOS landing stays in [hxbib/quodex-website](https://github.com/hxbib/quodex-website) on `/`.

Push to `main` deploys once this repo is connected in Cloudflare.

## Connect Git (once)

1. [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages) → **Create** → **Workers** → **Import a repository** (or open the existing `quodex-windows-website` Worker → **Settings** → **Builds** → **Connect**).
2. Authorize GitHub. Select **hxbib/quodex-windows-website**, branch `main`.
3. Build command: `npm ci && npm test && npm run build`
4. Deploy command: `npx wrangler deploy`
5. Node.js: **22**
6. Save. The first build publishes the Worker.

## Domain route (once)

Do **not** attach a Custom Domain for the whole zone — that would steal `quodex.app/`.

Worker → **Settings** → **Domains & Routes** → **Add** → **Route**:

- Zone: `quodex.app`
- Route: `quodex.app/windows*`

`wrangler.toml` already declares that route. A successful deploy attaches it. If deploy errors on zone permissions, add the route in the dashboard instead and drop the `[[routes]]` block.

More-specific Worker routes beat the macOS Worker Custom Domain, so `/` stays macOS and `/windows` becomes this site.

## Zone settings (quodex.app)

Apply on the domain, not per Worker. Safe for both landings.

SSL/TLS

- Mode **Full (strict)**
- Always Use HTTPS **On**
- Minimum TLS **1.2**, TLS 1.3 **On**
- Automatic HTTPS Rewrites **On**
- HSTS **On**, max-age 12 months, Include subdomains **On**, Preload **On** only after HTTPS is proven everywhere

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
- Bot Fight Mode **On** if it does not challenge normal browsers; otherwise Off
- WAF: Cloudflare Managed Ruleset **enabled**
- Email Obfuscation **Off**
- Hotlink Protection optional

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
