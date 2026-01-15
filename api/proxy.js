export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false });
    }

    const apiKey = req.headers["x-api-key"];
    if (apiKey !== process.env.PROXY_TOKEN) {
      return res.status(401).json({ ok: false });
    }

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const scriptKey = process.env.APPS_SCRIPT_KEY;
    if (!scriptUrl || !scriptKey) {
      return res.status(500).json({ ok: false });
    }

    let payload = req.body;
    if (typeof payload === "string") {
      payload = JSON.parse(payload);
    }

    const upstream = await fetch(
      `${scriptUrl}?api_key=${encodeURIComponent(scriptKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const text = await upstream.text();

    return res.status(upstream.ok ? 200 : 502).json({
      ok: upstream.ok,
      upstreamStatus: upstream.status,
      upstreamBody: text,
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: "Proxy crashed",
      message: e?.message ?? String(e),
    });
  }
}
