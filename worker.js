const ORIGIN = "https://raw.githubusercontent.com/hxbib/quodex-windows-website/cf-live";

const SECURITY = {
  "content-security-policy":
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self' data:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-resource-policy": "same-origin",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-permitted-cross-domain-policies": "none",
};

const APEX = {
  "/.well-known/security.txt": "/.well-known/security.txt",
  "/security.txt": "/security.txt",
  "/llms.txt": "/llms.txt",
  "/llm.txt": "/llm.txt",
  "/humans.txt": "/humans.txt",
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

function cacheControl(path) {
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
  let path = pathname.slice("/windows".length) || "/";
  if (path === "/" || path.endsWith("/")) return "/index.html";
  return path;
}

function isFilePath(path) {
  return /\/[^/]+\.[A-Za-z0-9]+$/.test(path);
}

function looksLikeHtml(response, path) {
  if (path.endsWith(".html")) return false;
  const type = response.headers.get("content-type") || "";
  return type.includes("text/html");
}

function notFound() {
  return applyHeaders(new Response("Not found", { status: 404 }), {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
  });
}

async function fromAssets(env, path, request) {
  if (!env.ASSETS || typeof env.ASSETS.fetch !== "function") return null;
  const response = await env.ASSETS.fetch(new Request(new URL(path, "https://assets.local"), request));
  if (!response.ok) return null;
  if (looksLikeHtml(response, path)) return null;
  return response;
}

async function fromCache(env, path) {
  const store =
    env.CACHE && typeof env.CACHE.get === "function"
      ? env.CACHE
      : env.ASSETS && typeof env.ASSETS.get === "function"
        ? env.ASSETS
        : null;
  if (!store) return null;
  const hit = await store.get(path, { type: "arrayBuffer" });
  if (!hit) return null;
  return new Response(hit, { headers: { "content-type": mime(path) } });
}

async function fromGithub(path) {
  return fetch(ORIGIN + path, {
    cf: { cacheTtl: path.endsWith(".html") ? 30 : 300, cacheEverything: true },
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

    const asset = await fromAssets(env, resolved, request);
    if (asset) {
      return applyHeaders(asset, { "cache-control": cacheControl(resolved) });
    }

    if (resolved.startsWith("/assets/")) {
      const cached = await fromCache(env, resolved);
      if (cached) {
        return applyHeaders(cached, { "cache-control": cacheControl(resolved) });
      }
    }

    const github = await fromGithub(resolved);
    if (!github.ok) {
      if (!isFilePath(resolved) && resolved !== "/index.html") {
        const index = await fromGithub("/index.html");
        if (index.ok) {
          const html = await index.arrayBuffer();
          return applyHeaders(new Response(html, { status: 200 }), {
            "content-type": "text/html; charset=utf-8",
            "cache-control": cacheControl("/index.html"),
          });
        }
      }
      return notFound();
    }

    const body = await github.arrayBuffer();
    if (resolved.startsWith("/assets/")) {
      const store =
        env.CACHE && typeof env.CACHE.put === "function"
          ? env.CACHE
          : env.ASSETS && typeof env.ASSETS.put === "function"
            ? env.ASSETS
            : null;
      if (store) void store.put(resolved, body);
    }
    return applyHeaders(new Response(body, { status: 200 }), {
      "content-type": mime(resolved),
      "cache-control": cacheControl(resolved),
    });
  },
};
