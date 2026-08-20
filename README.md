# 용왕집 (사주 서비스)

알다가도 모를 우리 인생, 용왕님께 물어보아요.

## 주요 기능

- 생년월일시를 입력받아 **만세력 원국(사주팔자)** 을 계산합니다 — 천간·지지·지장간·오행·십성·신살·십이운성·대운/세운.
- 원국을 바탕으로 **AI 총운 풀이**(4편의 이야기)를 생성해 텍스트로 제공합니다.
- 대운/세운 흐름 그래프에서 특정 연도를 고르면 **연도별 세운 풀이(AI)** 를 보여줍니다.

## 기술 스택

| 구분 | 사용 기술 |
| --- | --- |
| Frontend | React 18.3, TypeScript 5.5, Vite 5.4 |
| Backend | Node.js, Express |
| 사주 계산 | lunar-typescript |
| AI | OpenRouter (모델은 `OPENROUTER_MODEL` 로 지정, 예: `google/gemini-2.5-flash`) |
| 데이터 | 파일 기반(JSONL, 열람 팔자 누적 저장) — 별도 DB 없음 |

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
| `OPENROUTER_API_KEY` | OpenRouter API 키 (AI 풀이 필수) | `sk-or-...` |
| `OPENROUTER_MODEL` | 사용할 AI 모델 | `google/gemini-2.5-flash` |
| `PORT` | 백엔드 포트 | `8000` |
| `KASI_SERVICE_KEY` | 한국천문연구원 서비스 키 (선택) | |

## 프로젝트 구조

```
wasworkedinlocal_finalp/
├── src/
│   ├── main.tsx, App.tsx         # 엔트리포인트
│   ├── SajuForm.tsx              # 입력폼(원국 생성) → 대시보드 전환
│   ├── saju/                     # 만세력 계산 도메인 (calculator·fortune·shenSha·hanja·timeCorrection·types)
│   ├── services/                 # sajuApi.ts (백엔드 API 통신)
│   ├── components/
│   │   ├── form/                 # 입력 폼 부품 (NumberField·PillToggleGroup·DateInputGroup 등)
│   │   └── dashboard/            # 결과 대시보드 (원국·오행·십성·신살·대운 그래프·AI풀이)
│   ├── styles/                   # 전역 CSS (saju·base·variables·responsive)
│   └── assets/                   # fonts·img·icons
├── server/                       # Express 백엔드
│   ├── index.js                  # /api/reading, /api/year-fortune
│   └── .env.example
├── index.html
├── vite.config.ts
└── package.json
```

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 프론트 개발 서버 (5173) |
| `npm run build` | 타입체크(tsc) + 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run dev` (server/) | 백엔드 개발 서버 (8000, 파일 변경 감지) |

## API

Express 백엔드 엔드포인트:

- `POST /api/reading` — 원국(chart)을 받아 AI 총운 풀이 4편(`stories`)을 반환
- `POST /api/year-fortune` — 특정 연도 간지를 받아 AI 세운 풀이(`text`)를 반환

## 기여 방법

1. 이슈를 먼저 등록해 주세요.
2. `feat/기능명` 형식으로 브랜치를 생성합니다.
3. 커밋 메시지는 [Conventional Commits](https://www.conventionalcommits.org/)를 따릅니다.
4. PR을 올리면 리뷰 후 머지됩니다. (`dev` → `main` 병합은 관리자 담당)

## 라이선스

MIT © wasworkedinlocal
