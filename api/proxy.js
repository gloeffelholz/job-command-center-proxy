export default async function handler(req, res) {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.PROXY_TOKEN) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  /************ 1️⃣ Define upstream URL and API key ************/
  const upstream = new URL(process.env.APPS_SCRIPT_URL!);
  upstream.searchParams.set("api_key", process.env.APPS_SCRIPT_KEY);

  /************ 2️⃣ Determine HTTP method and fetch options ************/
  const method = (req.method || "GET").toUpperCase();
  const fetchOpts = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  /************ 3️⃣ Handle POST payload ************/
  if (method === "POST") {
    let body: any = {};
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch (err) {
      console.error("Failed to parse body:", err);
      body = {};
    }

    const flatBody: Record<string, any> = {};
    for (const [key, value] of Object.entries(body)) {
      if (value !== null && value !== undefined) {
        if (
          ["id", "company", "company_slug", "role", "status", "date_added"].includes(
            key
          )
        ) {
          flatBody[key] = String(value);
        } else if (typeof value === "object") {
          flatBody[key] = JSON.stringify(value);
        } else {
          flatBody[key] = value;
        }
      }
    }

    fetchOpts.body = JSON.stringify(flatBody);
  }

  /************ 4️⃣ Send request upstream ************/
  const r = await fetch(upstream.toString(), fetchOpts);
  const text = await r.text();

  /************ 5️⃣ Send response back to caller ************/
  res.status(r.status);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.send(text);
}
