# Quodex for Windows — landing

Interactive Windows 11 desktop for [Quodex for Windows](https://github.com/hxbib/quodex-windows).
Production URL: **https://quodex.app/windows**.

Static Vite site. It does not sign in to ChatGPT. Download the Windows app to sign in.

The macOS landing in [hxbib/quodex-website](https://github.com/hxbib/quodex-website) stays at `https://quodex.app/`.

Push to `main` publishes the site through Wrangler. See [CLOUDFLARE.md](CLOUDFLARE.md).

## Develop

```bash
npm ci
npm test
npm run typecheck
npm run dev
```

## Production

```bash
npm ci
npm test
npm run build
npx wrangler deploy
```

`npx wrangler deploy` is required. The GitHub Action fails if `CLOUDFLARE_API_TOKEN` is missing.

## License

MIT. Independent project — not affiliated with OpenAI.
