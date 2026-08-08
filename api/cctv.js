// CCTV 통합: ① 제주 교통정보센터(서울 리전에서 직접 호출) ② 국가 ITS
// 환경변수: JEJU_ITS_CODE, ITS_API_KEY(선택)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const jejuCode = process.env.JEJU_ITS_CODE;
  const itsKey = process.env.ITS_API_KEY;
  if (!jejuCode && !itsKey) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).json({ error: "JEJU_ITS_CODE / ITS_API_KEY 미설정" });
  }
  const num = v => { const n = parseFloat(v); return isFinite(n) ? n : 0; };
  const inJeju = c => c.lat > 33.0 && c.lat < 33.7 && c.lng > 126.0 && c.lng < 127.2;

  if (req.query.debug === "its" && itsKey) {
    try {
      const url = `https://openapi.its.go.kr:9443/cctvInfo?apiKey=${itsKey}&type=its&cctvType=1&minX=126.05&maxX=127.10&minY=33.05&maxY=33.65&getType=json`;
      const r = await fetch(url);
      const t = await r.text();
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ debug: "its", status: r.status, sample: t.slice(0, 2000) });
    } catch (e) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ debug: "its", error: String(e), cause: e && e.cause ? (e.cause.code || String(e.cause)) : "" });
    }
  }
  if (req.query.debug && jejuCode) {
    try {
      const r = await fetch(`http://api.jejuits.go.kr/api/getFacilityInfo?code=${jejuCode}&fcltType=FTY02`);
      const t = await r.text();
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ debug: true, status: r.status, sample: t.slice(0, 2000) });
    } catch (e) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ debug: true, error: String(e), cause: e && e.cause ? (e.cause.code || String(e.cause)) : "" });
    }
  }

  const results = { jeju: 0, its: 0 };
  let list = [];
  if (jejuCode) {
    try {
      const r = await fetch(`http://api.jejuits.go.kr/api/getFacilityInfo?code=${jejuCode}&fcltType=FTY02`);
      if (r.ok) {
        const j = await r.json();
        const arr = Array.isArray(j) ? j : (j.info || j.data || j.list || []);
        const rows = arr.map(o => ({
          name: String(o.fclt_lctn || o.fclt_id || "CCTV"),
          lat: num(o.x_crdn), lng: num(o.y_crdn), url: "", src: "jeju"
        })).filter(c => c.lat && c.lng && inJeju(c));
        list = list.concat(rows); results.jeju = rows.length;
      }
    } catch (e) {}
  }
  if (itsKey) {
    try {
      const url = `https://openapi.its.go.kr:9443/cctvInfo?apiKey=${itsKey}&type=its&cctvType=1&minX=126.05&maxX=127.10&minY=33.05&maxY=33.65&getType=json`;
      const r = await fetch(url);
      const j = await r.json();
      const rows = ((j.response && j.response.data) || []).map(c => ({
        name: c.cctvname, lat: num(c.coordy), lng: num(c.coordx),
        url: String(c.cctvurl || "").replace(/^http:/, "https:"), src: "its"
      })).filter(c => c.lat && c.lng && c.url);
      list = list.concat(rows); results.its = rows.length;
    } catch (e) { results.itsError = String(e).slice(0, 200); }
  }
  const seen = new Set();
  list = list.filter(c => {
    const k = c.name + "|" + c.lat.toFixed(4) + "," + c.lng.toFixed(4);
    if (seen.has(k)) return false;
    seen.add(k); return true;
  }).slice(0, 600);

  if (!list.length) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ error: "CCTV 데이터 없음 — 키 상태를 확인하세요", counts: results });
  }
  res.setHeader("Cache-Control", "public, max-age=120, s-maxage=600, stale-while-revalidate=3600");
  return res.status(200).json({ items: list, counts: results });
}
