# Quodex for Windows — website

The official landing page for [Quodex for Windows](https://github.com/hxbib/quodex-windows), a lightweight Windows tray app for viewing usage limits and banked resets across multiple ChatGPT accounts.

This is an interactive Windows 11 desktop in the browser. Sample accounts only — ChatGPT sign-in is disabled here. The installed app is a separate repository.

The macOS landing page is [quodex.app](https://quodex.app). This site is meant to live at [quodex.app/windows](https://quodex.app/windows).

## Requirements

- Node.js 22 or later
- npm

## Local development

```bash
npm ci
npm run dev
```

The dev server mounts the site at `/windows/`, matching the production path.

## Verification

```bash
npm run check
npm audit --omit=dev
```

## Cloudflare deployment

Build the static site, then deploy the Worker (assets + `/windows` prefix):

```bash
npm run build
npx wrangler deploy
```

In the Cloudflare dashboard for the `quodex.app` zone, add a route so this Worker receives `quodex.app/windows*`. The macOS site can keep serving the rest of the hostname.

`vite` production assets are rooted at `/windows/`. The Worker strips that prefix when it reads files from `dist/`.

The production Windows landing is intended for [quodex.app/windows](https://quodex.app/windows). Download still points at the [Windows GitHub Releases](https://github.com/hxbib/quodex-windows/releases/latest).

## License

Released under the MIT License. Quodex is an independent project and is not affiliated with or endorsed by OpenAI.
