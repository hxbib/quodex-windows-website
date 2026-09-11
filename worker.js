const SECURITY = {
  "content-security-policy":
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com; font-src 'self' data:; worker-src 'self' blob:; frame-src 'self' https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-resource-policy": "same-origin",
  "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
  "x-permitted-cross-domain-policies": "none",
};

const APEX = {
  "/.well-known/security.txt": "/.well-known/security.txt",
  "/security.txt": "/security.txt",
  "/llms.txt": "/llms.txt",
  "/llm.txt": "/llm.txt",
  "/humans.txt": "/humans.txt",
  "/robots.txt": "/robots.txt",
  "/sitemap.xml": "/sitemap.xml",
};

function applyHeaders(response, extra) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries({ ...SECURITY, ...extra })) {
    headers.set(key, value);
  }
  headers.delete("x-powered-by");
  headers.delete("server");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function mime(path) {
  const lower = path.toLowerCase();
  if (lower.endsWith(".html")) return "text/html; charset=utf-8";
  if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "text/javascript; charset=utf-8";
  if (lower.endsWith(".css")) return "text/css; charset=utf-8";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".ico")) return "image/x-icon";
  if (lower.endsWith(".xml")) return "application/xml; charset=utf-8";
  if (lower.endsWith(".json") || lower.endsWith(".webmanifest")) return "application/manifest+json";
  if (lower.endsWith(".txt") || lower.endsWith(".md")) return "text/plain; charset=utf-8";
  if (lower.endsWith(".woff2")) return "font/woff2";
  return "application/octet-stream";
}

function cacheControl(path, contentType) {
  const type = contentType || "";
  if (type.includes("text/html")) return "public, max-age=0, must-revalidate";
  if (path.startsWith("/assets/")) return "public, max-age=31536000, immutable";
  if (/\.(png|jpe?g|webp|avif|svg|ico|woff2?)$/i.test(path)) {
    return "public, max-age=86400, stale-while-revalidate=604800";
  }
  if (/\.(txt|xml|md)$/i.test(path) || path.includes("security.txt")) {
    return "public, max-age=3600";
  }
  return "public, max-age=0, must-revalidate";
}

function resolve(pathname) {
  if (APEX[pathname]) return APEX[pathname];
  if (pathname === "/windows") return { redirect: "/windows/" };
  if (!pathname.startsWith("/windows/")) return null;
  const path = pathname.slice("/windows".length) || "/";
  if (path === "/" || path.endsWith("/")) return "/index.html";
  return path;
}

function notFound() {
  return applyHeaders(new Response("Not found", { status: 404 }), {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.protocol === "http:") {
      url.protocol = "https:";
      return new Response(null, {
        status: 301,
        headers: { location: url.toString(), ...SECURITY },
      });
    }

    const resolved = resolve(url.pathname);
    if (resolved && resolved.redirect) {
      return new Response(null, {
        status: 308,
        headers: { location: resolved.redirect + url.search, ...SECURITY },
      });
    }
    if (!resolved) return notFound();
    if (!env.ASSETS || typeof env.ASSETS.fetch !== "function") {
      return applyHeaders(new Response("Windows landing is not deployed", { status: 503 }), {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      });
    }

    const assetRequest = new Request(new URL(resolved, "https://assets.local"), request);
    let asset = await env.ASSETS.fetch(assetRequest);
    const isFile = /\.[A-Za-z0-9]+$/.test(resolved);
    if (asset.status === 404 && !isFile) {
      asset = await env.ASSETS.fetch(new Request(new URL("/index.html", "https://assets.local"), request));
    }
    if (!asset.ok) return notFound();
    const type = asset.headers.get("content-type") || mime(resolved);
    if (isFile && resolved !== "/index.html" && type.includes("text/html")) {
      return notFound();
    }

    return applyHeaders(asset, {
      "content-type": type,
      "cache-control": cacheControl(resolved, type),
    });
  },
};
