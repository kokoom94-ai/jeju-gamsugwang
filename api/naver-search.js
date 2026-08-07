// 네이버 지역검색 프록시 (API HUB 신규 키 + 구 개발자센터 키 지원)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const query = String(req.query.query || "").trim();
  if (!query) { res.setHeader("Cache-Control", "no-store"); return res.status(400).json({ error: "query 파라미터가 필요합니다." }); }
  const id = process.env.NAVER_CLIENT_ID, secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) { res.setHeader("Cache-Control", "no-store"); return res.status(503).json({ error: "NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수를 설정하세요." }); }
  const q = "display=5&query=" + encodeURIComponent(query);
  const targets = [
    { url: "https://naverapihub.apigw.ntruss.com/search/v1/local?format=json&" + q,
      headers: { "X-NCP-APIGW-API-KEY-ID": id, "X-NCP-APIGW-API-KEY": secret } },
    { url: "https://openapi.naver.com/v1/search/local.json?" + q,
      headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret } }
  ];
  let last = null;
  for (const t of targets) {
    try {
      const r = await fetch(t.url, { headers: t.headers });
      const body = await r.text();
      if (r.ok) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "public, max-age=300, s-maxage=21600, stale-while-revalidate=86400");
        return res.status(200).send(body);
      }
      last = { s: r.status, body };
    } catch (e) { last = { s: 502, body: JSON.stringify({ error: "네이버 API 호출 실패", detail: String(e) }) }; }
  }
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(last.s).send(last.body);
}
