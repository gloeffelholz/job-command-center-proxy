export default async function handler(req, res) {
  // Bearer token auth (supported by GPT Builder UI)
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || token !== process.env.PROXY_TOKEN) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  // Forward to Apps Script
  const upstream = new URL(process.env.APPS_SCRIPT_URL);
  upstream.searchParams.set("api_key", process.env.APPS_SCRIPT_KEY);

  const method = (req.method || "GET").toUpperCase();

  const fetchOpts = {
    method,
    headers: { "Content-Type": "application/json" }
  };

  if (method === "POST") {
    fetchOpts.body = JSON.stringify(req.body ?? {});
  }

  const r = await fetch(upstream.toString(), fetchOpts);
  const text = await r.text();

  // Return exactly what Apps Script returns, but force JSON header for Actions
  res.status(r.status);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.send(text);
}
