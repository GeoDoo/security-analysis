import type { Plugin } from "vite";

const YAHOO_BASE = "https://query1.finance.yahoo.com";
const USER_AGENT = "Mozilla/5.0";

let cachedCookie: string | null = null;
let cachedCrumb: string | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getAuth(): Promise<{ cookie: string; crumb: string }> {
  if (cachedCookie && cachedCrumb && Date.now() - cacheTime < CACHE_TTL) {
    return { cookie: cachedCookie, crumb: cachedCrumb };
  }

  const cookieRes = await fetch("https://fc.yahoo.com/", {
    redirect: "manual",
    headers: { "User-Agent": USER_AGENT },
  });
  await cookieRes.text();

  const setCookies = cookieRes.headers.getSetCookie?.() ?? [];
  const cookie = setCookies.map((c) => c.split(";")[0]).join("; ");

  if (!cookie) {
    throw new Error("No cookie returned from fc.yahoo.com");
  }

  const crumbRes = await fetch(`${YAHOO_BASE}/v1/test/getcrumb`, {
    headers: { "User-Agent": USER_AGENT, Cookie: cookie },
  });

  if (!crumbRes.ok) {
    throw new Error(`Crumb request failed: HTTP ${crumbRes.status}`);
  }

  const crumb = await crumbRes.text();
  cachedCookie = cookie;
  cachedCrumb = crumb;
  cacheTime = Date.now();

  return { cookie, crumb };
}

export function yahooProxyPlugin(): Plugin {
  return {
    name: "yahoo-finance-proxy",
    configureServer(server) {
      server.middlewares.use("/api/yahoo", async (req, res) => {
        try {
          const { cookie, crumb } = await getAuth();

          const reqUrl = req.url ?? "/";
          const separator = reqUrl.includes("?") ? "&" : "?";
          const url = `${YAHOO_BASE}${reqUrl}${separator}crumb=${encodeURIComponent(crumb)}`;

          console.log(`[yahoo-proxy] → ${url}`);

          const apiRes = await fetch(url, {
            headers: { "User-Agent": USER_AGENT, Cookie: cookie },
          });

          if (!apiRes.ok) {
            if (apiRes.status === 401 || apiRes.status === 403) {
              cachedCookie = null;
              cachedCrumb = null;
            }
            console.log(`[yahoo-proxy] ✗ ${apiRes.status}`);
            res.writeHead(apiRes.status, {
              "Content-Type": "application/json",
            });
            res.end(
              JSON.stringify({ error: `Yahoo API returned ${apiRes.status}` })
            );
            return;
          }

          const body = await apiRes.text();
          console.log(`[yahoo-proxy] ✓ 200 (${body.length} bytes)`);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(body);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Proxy error";
          console.error(`[yahoo-proxy] ERROR: ${msg}`);
          cachedCookie = null;
          cachedCrumb = null;
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: msg }));
        }
      });
    },
  };
}
