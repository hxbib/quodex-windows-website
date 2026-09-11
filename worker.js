export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = url.pathname;
    if (path === "/windows") {
      url.pathname = "/windows/";
      return Response.redirect(url, 308);
    }
    if (path.startsWith("/windows/")) {
      path = path.slice("/windows".length) || "/";
    }
    return env.ASSETS.fetch(new Request(new URL(path + url.search, url.origin), request));
  },
};
