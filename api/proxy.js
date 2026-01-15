export default async function handler(req, res) {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.PROXY_TOKEN) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  // TEMPORARY TEST: bypass Apps Script
  res.status(200).json({
    ok: true,
    method: req.method,
    body: req.body ?? null
  });
}
