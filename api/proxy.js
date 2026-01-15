export default async function handler(req, res) {
const apiKey = req.headers["x-api-key"];
if (apiKey !== process.env.PROXY_TOKEN) {
  res.status(401).json({ ok: false, error: "Unauthorized" });
  return;
}

  // Forward to Apps Script
  const upstream = new URL(process.env.APPS_SCRIPT_URL);
  upstream.searchParams.set("api_key", process.env.APPS_SCRIPT_KEY);

  const method = (req.method || "GET").toUpperCase();

  const fetchOpts = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (method === "POST") {
    fetchOpts.body = JSON.stringify(req.body ?? {});
  }

  // 👇👇👇 ADD THESE THREE LINES 👇👇👇
  console.log("[DEBUG] Fetching upstream:", upstream.toString());
  const r = await fetch(upstream.toString(), fetchOpts);
  const text = await r.text();
  console.log("[DEBUG] Upstream status:", r.status, "Response snippet:", text.slice(0, 200));
  // 👆👆👆 END DEBUG ADDITIONS 👆👆👆

  res.status(r.status);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.send(text);
}
