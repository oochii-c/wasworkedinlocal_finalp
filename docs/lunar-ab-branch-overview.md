# 브랜치 개요 — `test/lunar-api`

> 이 브랜치를 처음 여는 사람을 위한 안내. **제품 기능 브랜치가 아니라 테스트(spike) 브랜치**다.
> 목적·구조·무엇을 살리고 버릴지·재현법을 정리한다.

## 1. 무엇 / 왜

사주 서비스의 **음력 변환**을 어느 방식으로 할지 정하기 위한 A/B 테스트 브랜치.

- **A안 — KASI 음양력정보 API** (한국천문연구원, `data.go.kr`)
- **B안 — lunar-typescript** (6tail, npm, 로컬)

분기점: `feature/onboarding_lunar` (팀의 lunar-typescript 도입 브랜치).
**결론은 `docs/lunar-ab-test-report.md` 참고** — 요약: 한국 사주엔 KASI가 정답, lib은 1990–2030 중 21개 달에서 하루 어긋남(설날·윤달 포함).

## 2. 구조

```
my-app/ (React+TS+Vite, :5173)
  src/components/Onboarding.tsx   입력폼(이름·성별·양음력·생일[자동포맷]·시간·도시). 계산 미연결(팀 것 + 자동포맷만 추가)
  src/components/LunarAB.tsx       ★ A/B 검증 도구. 같은 날짜를 KASI/lib 양쪽 변환해 대조. (제품 UI 미배선)
  src/lib/solarTime.ts             서울 진태양시 -32분 보정 헬퍼. (미사용, 사주 계산 붙일 때 쓸 것)
  vite.config.ts                   /api → :8000 proxy

server/ (Express, :8000)
  index.js                         GET /api/lunar?year&month&day → KASI 조회. 메모리 캐시 + backoff 재시도.
  .env                             KASI_SERVICE_KEY (gitignore, 커밋 안 됨)

docs/
  lunar-ab-test-report.md          ★ 테스트 결과·결론
  lunar-ab-branch-overview.md      이 문서
```

## 3. 지금 무엇이 도는가

- **App.tsx는 `<Onboarding/>`만 렌더.** A/B 도구(`LunarAB`)는 **제품에 미배선** — 코드는 기록으로만 존재.
- 즉 이 브랜치를 그냥 실행하면 입력폼만 보이고, A/B 비교는 자동으로 뜨지 않는다.

## 4. 살릴 것 / 버릴 것 (제품화 시)

| | 판단 |
|---|---|
| `docs/` 리포트·개요 | **살림** — 의사결정 근거 |
| `server/` (KASI + 캐시/재시도) | **살림** — 음력 확정에 KASI 채택 |
| `src/lib/solarTime.ts` | **살림** — 시주 보정에 필요 |
| `Onboarding.tsx` 생일 자동포맷 | **살림** — 순수 UX 개선 |
| `src/components/LunarAB.tsx` | **버림** — 검증용 도구. 제품 기능 아님 |
| `App.tsx`의 `<LunarAB/>` 배선 | 이미 제거됨 |

## 5. 재현법

### A/B 도구 다시 돌려보기
1. `server/.env`에 `KASI_SERVICE_KEY=...` (data.go.kr "음양력 정보" 활용신청 키, URL-encoded 그대로)
2. `cd server && npm run dev` → :8000
3. `cd my-app && npm run dev` → :5173
4. A/B 박스를 보려면 `App.tsx`에 임시로 다시 배선:
   ```tsx
   import LunarAB from './components/LunarAB.tsx'
   // <Onboarding/> 아래에 <LunarAB/> 추가
   ```
5. 날짜 입력 → "비교" → KASI(A)·lib(B) 결과와 일치 여부 표시

### 대량 대조(불일치 정량)
- 음력 **월경계 샘플링** 방식 사용(매일 전수는 KASI 일일 쿼터 초과).
- **동시성 1** 권장 — 버스트로 때리면 KASI rate-limit에 막힘.

## 6. 주의

- **KASI는 rate-limit 있음.** 대량·동시 호출 시 실패. 캐싱 + 낮은 동시성 필수.
- **`.env` 키는 커밋 금지** (`server/.gitignore`로 제외됨).
- 이 브랜치를 상위(main/feature)에 통째 머지하면 A/B 도구 잔재가 딸려간다. 채택은 리포트 결론대로 **KASI를 제품 파이프라인에 별도 배선**하는 방식으로.
