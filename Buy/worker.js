const ALLOWED = new Set(["www.papazao.tw", "papazao.tw"]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}

function resolveTarget(url) {
  const handle = (url.searchParams.get("handle") || "").trim();
  if (handle && /^[a-zA-Z0-9-]+$/.test(handle)) {
    return `https://www.papazao.tw/products/${handle}.json`;
  }
  const raw = url.searchParams.get("url") || "";
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (!ALLOWED.has(parsed.hostname) || !parsed.pathname.includes("/products/")) return null;
    const clean = parsed.pathname.replace(/\/+$/, "");
    return `https://www.papazao.tw${clean}.json`.replace(/\.json\.json$/, ".json");
  } catch {
    return null;
  }
}

async function proxy(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }
  const target = resolveTarget(new URL(request.url));
  if (!target) return json({ error: "請提供有效的 papazao.tw 商品網址或 handle" }, 400);
  const res = await fetch(target, {
    headers: { Accept: "application/json", "User-Agent": "PapazaoGroupBuy/1.0" },
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/proxy" || url.pathname === "/api/product") {
      return proxy(request);
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Not found", { status: 404 });
  },
};
