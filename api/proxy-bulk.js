export default async function handler(req, res) {
  try {
    const apiKey = req.headers["x-api-key"];
    if (apiKey !== process.env.PROXY_TOKEN) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const scriptKey = process.env.APPS_SCRIPT_KEY;
    if (!scriptUrl || !scriptKey) {
      return res.status(500).json({ ok: false, error: "Missing env" });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    let payload = req.body;
    if (typeof payload === "string") payload = JSON.parse(payload);

    const items =
      payload && typeof payload === "object" && Array.isArray(payload.items)
        ? payload.items
        : null;

    if (!items || items.length === 0) {
      return res.status(400).json({ ok: false, error:
