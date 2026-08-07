# 어디레 감수광? — 배포 가이드 (Vercel)

## 배포 절차
1. 이 저장소를 GitHub에 업로드 (저장소 첫 화면에 index.html, api 폴더, vercel.json이 바로 보여야 함)
2. vercel.com → Add New → Project → 저장소 Import → Framework Preset은 "Other" 그대로 → Deploy
3. 프로젝트 Settings → Environment Variables 등록 후 Redeploy:

| 변수 | 값 | 용도 |
|---|---|---|
| `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` | NAVER API HUB 검색 API 키 | 장소·편의시설 검색 |
| `JEJU_ITS_CODE` | 제주 교통정보센터 오픈API 인증코드 | 교차로 CCTV 202곳 |
| `ITS_API_KEY` | 국가교통정보센터 오픈API 키 (선택) | 국도 CCTV 영상 재생 |

4. 확인
   - `/api/naver-search?query=제주공항` → items 나오면 검색 정상
   - `/api/cctv` → items 나오면 CCTV 정상 (`?debug=1` 로 원본 응답 확인 가능)

## 운영 메모
- 함수 실행 지역은 vercel.json의 `"regions":["icn1"]`(서울) — 해외 IP 차단 공공 API 대응
- 인기 순위 갱신: popular.json의 items 배열 교체 후 커밋 → 자동 재배포
- 도메인 변경 시 index.html의 og:url / og:image / twitter:image 3곳 주소 수정
- 검색 결과 6시간, CCTV 10분 CDN 캐시 적용(호출량 절약), 오류 응답은 캐시 안 함
