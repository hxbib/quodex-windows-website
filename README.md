# Quodex for Windows — landing

Interactive Windows 11 desktop for [Quodex for Windows](https://github.com/hxbib/quodex-windows).
This is the page that should live at **https://quodex.app/windows**.

It is a static Vite site. It does not sign in to ChatGPT. Download the Windows app to sign in.

## Develop

```bash
npm ci
npm test
npm run typecheck
npm run dev
```

## Production build for quodex.app/windows

```bash
npm ci
npm run build
```

`dist/` is a static folder with base `/windows/`.

Deploy this repo as a Cloudflare Worker (see `wrangler.toml`):

```bash
npx wrangler deploy
```

The Worker serves the site at `/windows`. The macOS landing in [hxbib/quodex-website](https://github.com/hxbib/quodex-website) stays at `/`.

Download still falls back to GitHub Releases if the zip is not hosted next to the page.

## License

MIT. Independent project — not affiliated with OpenAI.
