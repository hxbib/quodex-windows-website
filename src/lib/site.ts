export const SITE = {
  name: "Quodex",
  product: "Quodex for Windows",
  tagline: "Know your limits. Own your resets.",
  summary:
    "A tray companion for every ChatGPT account — live usage, pooled capacity, countdowns, and banked resets.",
  download: "https://github.com/hxbib/quodex-windows/releases/latest",
  asset: "https://github.com/hxbib/quodex-windows/releases/latest",
  source: "https://github.com/hxbib/quodex-windows",
  macos: "https://quodex.app",
  macosSource: "https://github.com/hxbib/Quodex",
  windows: "https://quodex.app/windows",
  author: "Sadman Habib",
  authorUrl: "https://github.com/hxbib",
  requirements: "Windows 10 1809+ or Windows 11 · x64 · MIT",
  downloadLabel: "Download for Windows",
} as const;

export function openProductLink(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function downloadWindowsApp() {
  openProductLink(SITE.download);
}
