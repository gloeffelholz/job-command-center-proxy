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

  // Ensure body is an object
  if (!body || typeof body !== "object") {
    console.error("Payload is not an object:", body);
    body = {};
  }

  // Build flat payload for Apps Script
  const flatBody: Record<string, any> = {};

  for (const [key, value] of Object.entries(body)) {
    if (value !== null && value !== undefined) {
      // Required fields as strings
      if (
        ["id", "company", "company_slug", "role", "status", "date_added"].includes(key)
      ) {
        flatBody[key] = String(value);
      } else if (typeof value === "object") {
        // Nested objects must be stringified (score_snapshot, unknowns, etc.)
        flatBody[key] = JSON.stringify(value);
      } else {
        // Optional fields as-is
        flatBody[key] = value;
      }
    }
  }

  // Send flat payload directly to Apps Script
  fetchOpts.body = JSON.stringify(flatBody);
}

// Send upstream
const r = await fetch(upstream.toString(), fetchOpts);
const text = await r.text();

res.status(r.status);
res.setHeader("Content-Type", "application/json");
res.setHeader("Cache-Control", "no-store");
res.send(text);
