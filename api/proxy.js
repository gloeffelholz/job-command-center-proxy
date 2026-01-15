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
  // Parse the incoming request body
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  // Extract the opportunity object
  const opp = body?.opportunity ?? body;

  // Build a new object to send upstream
  const cleanedOpp: Record<string, any> = {};

  for (const [key, value] of Object.entries(opp)) {
    if (value !== null && value !== undefined) {
      // Enforce strings only for required fields
      if (
        ["id", "company", "company_slug", "role", "status", "date_added"].includes(key)
      ) {
        cleanedOpp[key] = String(value);
      } else {
        // Keep optional fields as-is
        cleanedOpp[key] = value;
      }
    }
  }

  // Send the cleaned opportunity to upstream
  fetchOpts.body = JSON.stringify({ opportunity: cleanedOpp });
}

// Send upstream
const r = await fetch(upstream.toString(), fetchOpts);
const text = await r.text();

res.status(r.status);
res.setHeader("Content-Type", "application/json");
res.setHeader("Cache-Control", "no-store");
res.send(text);
