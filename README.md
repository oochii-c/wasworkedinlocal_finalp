# 용왕집 (사주 서비스)

알다가도 모를 우리 인생, 용왕님께 물어보아요.

## 주요 기능

- 생년월일시를 입력받아 **만세력 원국(사주팔자)** 을 계산합니다 — 천간·지지·지장간·오행·십성·신살·십이운성·대운/세운.
- 원국을 바탕으로 **AI 총운 풀이**(4편의 이야기)를 생성해 텍스트로 제공합니다.
- **주제별 풀이** — 관심 주제 목록과 주제 상세, 주제 2개를 묶은 조합 풀이.
- 대운/세운 흐름 그래프에서 특정 연도를 고르면 **연도별 세운 풀이(AI)** 를, 대운 구간을 고르면 **대운 풀이(AI)** 를 보여줍니다.
- **오늘의 운세** — 일진 기반 하루 풀이와, 이미지 모델로 그린 **오늘의 부적**.
- **캐릭터 AI 상담** — 용왕·거북·상어·갈치·돌고래·공주 등 페르소나와 1:1 대화. 대화는 브라우저에 남아 다시 열면 이어집니다.
- **소원 빌기** — 용왕에게 소원을 빌고 지난 소원을 다시 봅니다. AI 호출 없이 브라우저에만 저장됩니다.

## 기술 스택

| 구분 | 사용 기술 |
| --- | --- |
| Frontend | React 18.3, TypeScript 5.5, Vite 5.4 |
| Backend | Node.js 20, Express 4 |
| 사주 계산 | lunar-typescript (브라우저에서 실행) |
| AI | OpenRouter — 텍스트 모델(`OPENROUTER_MODEL`), 이미지 모델(`OPENROUTER_IMAGE_MODEL`) |
| 데이터 | 브라우저 저장소(localStorage·IndexedDB) + 서버의 `pillars.jsonl` 누적 기록 — 별도 DB 없음 |

## 아키텍처

```
[사용자] ─▶ ┌ React 브라우저 (:5173) ┐  ┌ Node 서버 (:8000) ┐  ┌ OpenRouter ┐
            │ 생년월일시 → 원국 계산  │─▶│ 프롬프트 조립      │─▶│ 텍스트 모델 │
   풀이·상담 │ 결과 화면              │◀─│ API 키 보관        │◀─│ 이미지 모델 │
            └────────────────────────┘  └───────────────────┘  └────────────┘
                     │                            │
                     │ 입력값 → localStorage       └ data/pillars.jsonl
                     │ 대화   → IndexedDB            (열람한 팔자 기록)
                     │ 원국   → React Context
                     └ 풀이   → Context 내 캐시(ref)
```

- **원국 계산은 브라우저에서 끝납니다.** `src/saju/` 가 lunar-typescript로 진태양시 보정·지장간·십성·신살·대운/세운을 계산하고, 서버로는 계산 결과(chart JSON)만 보냅니다. 서버가 없어도 원국 화면은 그려집니다.
- **서버는 상태를 갖지 않습니다.** 요청마다 원국을 통째로 받아 `chartToText` 로 문장화하고, 용도별 시스템 프롬프트(`server/prompts/`)를 붙여 OpenRouter를 한 번 호출한 뒤 JSON을 검증해 돌려줍니다. OpenRouter 키는 서버 `.env` 에만 있습니다.

### 저장 층

| 저장 위치 | 담는 것 | 수명 |
| --- | --- | --- |
| `localStorage` (`saju:input`) | 입력값 | 영구 |
| `localStorage` (`saju:wishes:<팔자8자>`) | 빌었던 소원 (원국별 최근 30개) | 영구 |
| IndexedDB (`saju-counsel`) | 캐릭터별 상담 대화 (`팔자8자\|personaId` 키) | 영구 |
| React Context state | 원국(chart)·현재 화면·연도 | 새로고침 시 소멸 |
| Context 내 `useRef` 캐시 | AI 응답(총운·오늘 풀이·부적) — 같은 원국이면 재호출 안 함 | 새로고침 시 소멸 |
| `server/data/pillars.jsonl` | 열람 시각·이름·성별·팔자 | 영구(append 전용) |

> 상담 대화 외의 AI 응답은 새로고침하면 사라지고 다시 생성됩니다.

## 시작하기

### 요구 사항

- Node.js 20 이상

### 설치 및 실행

프론트엔드(개발 서버):

```bash
npm install
npm run dev        # http://localhost:5173
```

백엔드(사주 풀이 API 서버):

```bash
cd server
npm install
cp .env.example .env   # 값 채우기 (아래 환경 변수 참고)
npm run dev            # http://localhost:8000
```

> 프론트의 `/api` 요청은 `vite.config.ts` 프록시를 통해 백엔드(`localhost:8000`)로 전달됩니다.

## 환경 변수

`server/.env.example` 을 복사해 `server/.env` 에 값을 채웁니다.

| 이름 | 설명 | 예시 |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | OpenRouter API 키 (AI 기능 필수) | `sk-or-...` |
| `OPENROUTER_MODEL` | 텍스트 풀이·상담에 쓸 모델 | `google/gemini-2.5-flash` |
| `OPENROUTER_IMAGE_MODEL` | 오늘의 부적 생성 모델 | `google/gemini-3-pro-image` |
| `PORT` | 백엔드 포트 | `8000` |
| `KASI_SERVICE_KEY` | 한국천문연구원 서비스 키 — **현재 코드에서 사용하지 않습니다** (음력·절기는 lunar-typescript로 처리) | |

페르소나별로 모델을 따로 지정한 경우 `server/prompts/personas/` 의 설정이 `OPENROUTER_MODEL` 보다 우선합니다.

## 프로젝트 구조

```
finalp_prompt/
├── src/
│   ├── main.tsx, App.tsx         # 엔트리포인트 (view 값으로 화면 전환, 라우터 없음)
│   ├── SajuForm.tsx              # 입력폼(원국 생성) → 대시보드 전환
│   ├── state/SajuContext.tsx     # 입력값·원국·화면·AI 응답 캐시
│   ├── saju/                     # 만세력 계산 (calculator·fortune·shenSha·daily·hanja·timeCorrection·types)
│   ├── services/                 # sajuApi.ts · counselApi.ts (백엔드 API 통신)
│   ├── pages/
│   │   ├── portal/               # 첫 화면
│   │   ├── dashboard/            # 원국·오행·십성·신살·대운 그래프·AI 총운
│   │   ├── topics/               # 주제 목록·상세·조합
│   │   ├── yearFortune/          # 세운 화면 + 자체 saju/ 폴더(ganzhi·scoring·insights)
│   │   ├── today/                # 오늘의 운세·부적
│   │   ├── wish/                 # 소원 빌기 (wishStore.ts = localStorage 영속)
│   │   └── aiCounsel/            # 캐릭터 상담 (threadStore.ts = IndexedDB 영속)
│   ├── components/               # form · dashboard · layout · effects 부품
│   ├── styles/                   # 전역 CSS (saju·base·variables·responsive)
│   └── assets/                   # fonts·img·icons
├── server/
│   ├── index.js                  # 엔드포인트 8개
│   ├── counsel.js                # POST /api/counsel (Router)
│   ├── prompt-utils.js           # chartToText, 천간·지지 라벨
│   ├── prompts/                  # 용도별 시스템 프롬프트 + personas/
│   ├── data/pillars.jsonl        # 열람 팔자 누적 (실행 중 생성)
│   └── .env.example
├── scripts/                      # 개발용 스크립트 (scripts/README.md 참고)
├── index.html
├── vite.config.ts
└── package.json
```

> 사주 계산 코드는 `src/saju/` 와 `src/pages/yearFortune/saju/` 두 곳에 나뉘어 있습니다. 후자는 `src/saju/index.ts` 를 거치지 않고 `src/saju/fortune.ts` 를 직접 import 하고, `src/pages/topics/` 도 `yearFortune/saju/insights` 를 참조합니다.

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 프론트 개발 서버 (5173) |
| `npm run build` | 타입체크(tsc) + 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run dev` (server/) | 백엔드 개발 서버 (8000, 파일 변경 감지) |
| `npm start` (server/) | 백엔드 실행 |

## API

Express 백엔드 엔드포인트 — 전부 `POST` 이며, 요청 하나당 OpenRouter를 한 번 호출합니다.

| 경로 | 요청 본문 | 응답 |
| --- | --- | --- |
| `/api/reading` | `name`, `gender`, `chart` | `stories[]` (총운 4편) |
| `/api/themes` | `name`, `gender`, `chart` | `themes[]` |
| `/api/theme-detail` | `key`, `label`, `chart` | `text` |
| `/api/theme-combo` | `labels[2]`, `chart` | `text` |
| `/api/year-fortune` | `year`, `ganZhi`, `rel`, `dayGan`, `stars`, `wuXingCount`, `domainScores`, `monthly` | `text`, `summary`, `domains`, `months[]` |
| `/api/dayun-fortune` | `dayGan`, `ganZhi`, `startYear`, `endYear`, `rel`, `stars` | `text` |
| `/api/daily-fortune` | `dayGan`, `dayGanZhi`, 길신·흉살 등 | `energy`, `text`, `src` |
| `/api/daily-talisman` | `dayGan`, `dayGanZhi`, `band`, `jiShen`, `xiongSha`, `yi`, `ji`, `positionCai` | `image`(data URL), `title`, `caption`, `blessing` |
| `/api/counsel` | `chart`, `messages[]`, `personaId` (질문 500자 제한) | `reply`, `src` |

## 기여 방법

1. 이슈를 먼저 등록해 주세요.
2. `feat/기능명` 형식으로 브랜치를 생성합니다.
3. 커밋 메시지는 [Conventional Commits](https://www.conventionalcommits.org/)를 따릅니다.
4. PR을 올리면 리뷰 후 머지됩니다. (`dev` → `main` 병합은 관리자 담당)

## 라이선스

MIT © wasworkedinlocal
