# Quodex for Windows — landing

Interactive Windows 11 desktop for [Quodex for Windows](https://github.com/hxbib/quodex-windows).
Production URL: **https://quodex.app/windows**.

Static Vite site. It does not sign in to ChatGPT. Download the Windows app to sign in.

The macOS landing in [hxbib/quodex-website](https://github.com/hxbib/quodex-website) stays at `https://quodex.app/`.

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
npm run build
npx wrangler deploy
```

Connect this GitHub repo to Cloudflare so a push to `main` deploys. See [CLOUDFLARE.md](CLOUDFLARE.md).

## License

MIT. Independent project — not affiliated with OpenAI.
