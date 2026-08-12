# CLAUDE.md — 팀 공용 Claude 지침

React + TypeScript + Vite 프로젝트. 팀원 4명 공통 적용.

---

## 프로젝트 구조

```
my-app/
  src/        ← 소스코드
  index.html
  vite.config.ts
  tsconfig.json
```

**스택:** React 19 · TypeScript 6 · Vite 8

---

## 브랜치 구조

```
main                  ← final deployment. do not handle independently
  └── dev             ← development layer. merge in only P/R
        ├── feat/feature name     예) feature/home page
        ├── feat/feature name     예) feature/intepretation page
        ├── feat/feature name     예) feature/submit form
        └── feat/feature name     예) feature/bot counselor
```

> ⚠️ Create branch by **"working unit"** like modificaiton, creating feature, revising, etc.
> if A person take in charge 2 pages then the number of branch has to be two(branch for each one).
> This is for preventing PR to be corrupted by another work, and allow each work to move by own pace


---

## working order : Branch

**1. Up to date the branch when you start your work**
```bash
git checkout dev
git pull origin dev
```

**2. Create branch (for each feature)**
```bash
git checkout -b feature/name
```

**3. up to date dev side working flow periodically (start your day, after lunch)**
```bash
git checkout feature/
git merge dev
```
> 'dev' branch up to date itself every second, do not wait for you
> it could be concluded as confliction between existing and your developed code . rebase could make confuse so fix the word as `merge`.

**4.push when you complete your work**
```bash
git add .
git commit -m "feat: describing feature"
git push origin feature/describtion
```

**5. Create new PR on Github**
- 대상 branch: `dev` (does not mean 'main')
- title: `feature name` ex) `Add submit form`

---

## rules for shared file

`tokens.css`, `App.tsx`, `router.tsx` etc **files interrupting on multi number of pages ** tend to be in confliction.

- When you modify those sort of files **Notice to your team, then finish and merge the revision as soon as possible**
- 미루ddd면 미룰수록 다른 사람 브랜치와 충돌할 확률이 올라간다

---

## PR 규칙

- 최소 1명 수락 후 머지
- 본인 PR 본인 머지 금지
- 충돌 있으면 본인이 해결 후 다시 PR
- dev → main 머지는 팀장만

---

## 금지사항

- `main` 직접 push 금지
- `dev` 직접 push 금지
- 남의 브랜치 파일 수정 금지
- `.env`, `*.key` 커밋 금지
- `node_modules/` 커밋 금지

## 필수사항

- `package-lock.json`은 **항상 커밋** (팀원끼리 패키지 버전 통일용, `.gitignore`에 넣지 말 것)

---

## 커밋 메시지 규칙

```
feat: 새 기능 추가
fix: 버그 수정
style: 스타일/포맷 변경
refactor: 리팩토링
chore: 설정, 패키지 등 기타
```

---

## 개발 명령어

```bash
cd my-app
npm install       # 처음 설치
npm run dev       # 로컬 서버 (localhost:5173)
npm run build     # 빌드
npm run lint      # 린트 검사
```

---

## PR 머지 전 체크리스트

- [ ] `npm run lint` 오류 없음
- [ ] `npm run build` 성공
- [ ] 로컬에서 기능 동작 확인
- [ ] `.env` 파일 커밋 안 됨
- [ ] PR 대상이 `dev` 인지 확인

---

## GitHub 브랜치 보호 설정 (팀장만)

GitHub → 레포 → Settings → Branches → Add branch protection rule

**main:**
```
Branch name pattern: main
✅ Require a pull request before merging
✅ Require approvals: 1
✅ Dismiss stale pull request approvals when new commits are pushed
✅ Do not allow bypassing the above settings
```

**dev:**
```
Branch name pattern: dev
✅ Require a pull request before merging
✅ Require approvals: 1
✅ Dismiss stale pull request approvals when new commits are pushed
```

**추가 설정 (Settings → General):**
```
✅ Automatically delete head branches   (머지된 브랜치 자동 정리)

Pull Requests:
✅ Allow squash merging 만 체크, 나머지(Merge commit, Rebase merging)는 해제
   → dev/main 히스토리가 PR 1개당 커밋 1개로 깔끔하게 정리됨
```

---

## 디자인 가이드

### 원칙

1. **뻔한 디자인 거부** — 흔한 AI 스타일이나 템플릿 디자인 사용 금지
2. **주제 먼저 정하기** — 대상 사용자와 목적을 확정한 뒤 디자인 시작
3. **개성 있는 타이포·히어로** — 눈에 띄는 글씨체 + 핵심을 보여주는 히어로 섹션 구성
4. **의미 있는 구조** — 번호·선·구분선 등은 실제 순서나 이유가 있을 때만 사용
5. **적당한 애니메이션** — 모션은 꼭 필요한 곳에만 자연스럽게 적용
6. **먼저 계획 세우기** — 색상, 글꼴, 레이아웃 계획을 먼저 세운 뒤 코드 작성
7. **과감하게 빼기** — 핵심 특징 하나에 집중, 나머지는 깔끔하게 비우기
8. **모바일 대응 필수** — 모바일에서도 문제없이 작동하고 누구나 쓰기 편하게
9. **쉬운 글쓰기** — 웹사이트 카피는 사용자 입장에서 짧고 명확하게
10. **친절한 오류 안내** — 에러·빈 화면 시 다음 행동을 친절하게 안내

### 코드 작성 규칙

- 코드 안에 **한글 주석** 작성
- **접근성(a11y) 문제** 발견 시 즉시 공유 또는 수정

### PR 전 화면 연출

Claude가 PR 관련 작업(push, commit, PR 생성 등)을 수행하기 **직전에** 아래 배너를 화면에 출력한다.

```
╔══════════════════════════════════════════════╗
║                                              ║
║   ✦ ✦ ✦   C L A U D E   ✦ ✦ ✦              ║
║                                              ║
║   ★  PR 준비 완료!                           ║
║   ☆  브랜치: feature/내이름                  ║
║   ★  대상: dev                               ║
║                                              ║
║   ─────────── 체크리스트 ───────────          ║
║   ✅ lint 통과                                ║
║   ✅ build 성공                               ║
║   ✅ 로컬 동작 확인                           ║
║   ✅ .env 미포함                              ║
║   ✅ 스크린샷 첨부                            ║
║   ✅ 접근성 확인                              ║
║                                              ║
║   ✦ 아래에 결과 화면을 첨부합니다 ✦          ║
║                                              ║
╚══════════════════════════════════════════════╝
```

- 미통과 항목은 `❌`로 바꾸고 해결 방법을 배너 아래에 안내
- 브랜치 이름·대상 브랜치는 실제 작업 내용으로 자동 치환
- 배너 출력 후 **스크린샷 → 코드 결과물** 순서로 이어서 출력
