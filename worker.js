const SECURITY = {
  "content-security-policy":
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self' data:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-resource-policy": "same-origin",
  "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
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

function cacheControl(path) {
  if (path.startsWith("/assets/")) return "public, max-age=31536000, immutable";
  if (/\.(png|jpe?g|webp|avif|svg|ico|woff2?)$/i.test(path)) {
    return "public, max-age=86400, stale-while-revalidate=604800";
  }
  return "public, max-age=0, must-revalidate";
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

    let path = url.pathname;
    if (path === "/windows") {
      url.pathname = "/windows/";
      return new Response(null, {
        status: 308,
        headers: { location: url.pathname + url.search, ...SECURITY },
      });
    }
    if (path.startsWith("/windows/")) {
      path = path.slice("/windows".length) || "/";
    }

    const assetRequest = new Request(new URL(path + url.search, url.origin), request);
    const response = await env.ASSETS.fetch(assetRequest);
    return applyHeaders(response, { "cache-control": cacheControl(path) });
  },
};
