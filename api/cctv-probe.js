// [임시 탐색기] 승인 인증코드로 CCTV 영상 관련 후보 엔드포인트를 일괄 점검
// 확인 후 이 파일은 삭제해도 됨
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const code = process.env.JEJU_ITS_CODE;
  if (!code) return res.status(503).json({ error: "JEJU_ITS_CODE 미설정" });

  const id = String(req.query.id || "CA000010"); // 이호테우해변입구교차로
  const candidates = [
    `infoCctvList?code=${code}`,
    `getCctvInfo?code=${code}`,
    `getCctvInfo?code=${code}&fclt_id=${id}`,
    `getCctvUrl?code=${code}&fclt_id=${id}`,
    `getCctvStream?code=${code}&fclt_id=${id}`,
    `getFacilityInfo?code=${code}&fcltType=FTY02&fclt_id=${id}`,
    `getFacilityImg?code=${code}&fclt_id=${id}`,
    `getFacilityVideo?code=${code}&fclt_id=${id}`,
    `infoCctvUrlList?code=${code}`,
    `getCctvHls?code=${code}&fclt_id=${id}`
  ];
  const out = [];
  for (const ep of candidates) {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 6000);
      const r = await fetch(`http://api.jejuits.go.kr/api/${ep}`, { signal: ctrl.signal });
      clearTimeout(to);
      const t = await r.text();
      out.push({ ep: ep.replace(code, "***"), status: r.status, snippet: t.slice(0, 300) });
    } catch (e) {
      out.push({ ep: ep.replace(code, "***"), error: String(e).slice(0, 120) });
    }
  }
  return res.status(200).json({ probe: true, tried: out.length, results: out });
}
