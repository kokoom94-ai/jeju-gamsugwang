// OSM Overpass 프록시 (네이버 무응답 시 폴백)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  let q = "";
  if (req.method === "POST") {
    if (req.body && typeof req.body === "object") q = req.body.data || "";
    else if (typeof req.body === "string") {
      const m = req.body.match(/^data=(.*)$/s);
      q = m ? decodeURIComponent(m[1]) : req.body;
    }
  } else q = String(req.query.q || "");
  if (!q.trim()) { res.setHeader("Cache-Control", "no-store"); return res.status(400).json({ error: "쿼리가 없습니다" }); }
  const MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter"
  ];
  let lastErr = null;
  for (const m of MIRRORS) {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 20000);
      const r = await fetch(m, { method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(q), signal: ctrl.signal });
      clearTimeout(to);
      if (!r.ok) { lastErr = "HTTP " + r.status; continue; }
      const body = await r.text();
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=21600");
      return res.status(200).send(body);
    } catch (e) { lastErr = String(e); }
  }
  res.setHeader("Cache-Control", "no-store");
  return res.status(502).json({ error: "시설 서버 응답 없음", detail: lastErr });
}
