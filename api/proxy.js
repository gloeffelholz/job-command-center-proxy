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
  // Parse request body safely
  let body: any = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (err) {
    console.error("Failed to parse body:", err);
    body = {};
  }

  // Extract opportunity object
  const opp = body?.opportunity;
  if (!opp || typeof opp !== "object") {
    console.error("No opportunity object found in payload:", body);
    fetchOpts.body = JSON.stringify({ opportunity: {} });
  } else {
    // Build cleaned object
    const cleanedOpp: Record<string, any> = {};
    for (const [key, value] of Object.entries(opp)) {
      if (value !== null && value !== undefined) {
        if (["id", "company", "company_slug", "role", "status", "date_added"].includes(key)) {
          cleanedOpp[key] = String(value);
        } else {
          cleanedOpp[key] = value;
        }
      }
    }
    fetchOpts.body = JSON.stringify({ opportunity: cleanedOpp });
  }
}

// Send upstream
const r = await fetch(upstream.toString(), fetchOpts);
const text = await r.text();

res.status(r.status);
res.setHeader("Content-Type", "application/json");
res.setHeader("Cache-Control", "no-store");
res.send(text);
