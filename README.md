# 용 궁 (사주 서비스)

알다가도 모를 우리 인생 용왕님께 물어보아요.

## 주요 기능

- 사용자에게서 입력받은 생년월일시를 읽고 풀이한 평생운을 텍스트로 제공합니다.
- 풀이된 평생운을 토대로 고민이나 진로 상담 등으로 사용자의 고충 해소에 조력합니다.

## 기술 스택

| 구분 | 사용 기술 |
| --- | --- |
| Frontend | React, TypeScript |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Infra | Docker, AWS |

## 시작하기

### 요구 사항

- React 19 · TypeScript 6 · Vite 8
- Node.js 20 이상

### 설치 및 실행

```bash
---up to date
```

기본 주소: http://localhost:3000

## 환경 변수

`.env.example`을 복사해 값을 채웁니다.

| 이름 | 설명 | 예시 |
| --- | --- | --- |
| `DATABASE_URL` | DB 연결 문자열 | `postgres://user:pw@localhost:5432/app` |
| `JWT_SECRET` | 토큰 서명 키 | `change-me` |
| `NEXT_PUBLIC_API_URL` | 프론트에서 쓰는 API 주소 | `http://localhost:8000` |

## 프로젝트 구조

.
├── src/
│ ├── app/ # 라우트 및 페이지
│ ├── components/ # 공용 컴포넌트
│ ├── lib/ # 유틸, API 클라이언트
│ └── server/ # 서버 로직
├── public/
├── tests/
└── docker-compose.yml


## 스크립트


## 배포

```bash
docker compose up -d --build
```

`main` 브랜치 머지 시 CI에서 자동 배포됩니다.

## API 문서

- 
- 상세 명세: []

## 기여 방법

1. 이슈를 먼저 등록해 주세요.
2. `feat/기능명` 형식으로 브랜치를 생성합니다.
3. 커밋 메시지는 [Conventional Commits](https://www.conventionalcommits.org/)를 따릅니다.
4. PR을 올리면 리뷰 후 머지됩니다.

## 라이선스

MIT ©wasworkedinlocal