# 년도별 운세 상세 페이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "그 해 운세 상세" (year fortune detail) page as a standalone Next.js + TypeScript app, where the page component receives a `chart: SajuExtended` prop (no global saju store), following the low-fi spec: year nav, 6 domain star ratings, a 12-month bar chart with a single info popup, good/caution month callouts, and an AI-summary text block.

**Architecture:** A shared `src/saju/` module defines the `SajuExtended` data contract and mock saju-calculation functions (real year-ganzhi arithmetic, mocked month-ganzhi, and a documented heuristic for domain/monthly scoring). The page itself lives under `src/app/year-fortune/[year]/` as a Server Component that composes five presentational components, each with its own CSS Module. Only the monthly-flow component is a Client Component (it owns local popup state).

**Tech Stack:** Next.js 15 (App Router) + React 19 + TypeScript, CSS Modules, Vitest + React Testing Library for tests.

## Global Constraints

- Each year-fortune page receives its birth-chart data as a `chart: SajuExtended` prop — no global store (Context/Zustand/localStorage) for the chart. Global state strategy is undecided (separate team meeting agenda).
- New functionality goes in new files; do not restructure or reformat unrelated files.
- Real sajum calculation libraries don't exist yet: `getYearGanZhi` is implemented with the real 60-gapja arithmetic (it's simple and verifiable), but `getMonthInGanZhi` and all domain/monthly scoring are explicit, documented mocks/heuristics, each with a `// TODO: 실제 사주 라이브러리로 교체` (or equivalent) comment.
- The "AI 총평" section renders a `summary: string` prop as-is — no LLM API integration in this plan.
- Styling uses CSS Modules; one new `.module.css` file per component, no shared/global CSS beyond the Next.js default reset.
- The monthly-flow "?" icon is a single icon next to the "월별 흐름" section heading (not one per bar); clicking it shows all 12 months' ganzhi in one popup list.

---

## Task 1: Scaffold the Next.js + TypeScript project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `next-env.d.ts`
- Create: `.gitignore`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/app/page.tsx`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: a buildable Next.js app rooted at `src/`, with import alias `@/*` → `./src/*`, ready for later tasks to add `src/saju/` and `src/app/year-fortune/[year]/`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "saju-fortune-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "^15.1.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.3",
    "@types/node": "^22.10.5",
    "@types/react": "^19.0.7",
    "@types/react-dom": "^19.0.3",
    "vitest": "^2.1.8",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/user-event": "^14.5.2"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Write `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
```

- [ ] **Step 4: Write `next-env.d.ts`**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
```

- [ ] **Step 5: Write `.gitignore`**

```
node_modules
.next
dist
*.local
```

- [ ] **Step 6: Write `src/app/globals.css`**

```css
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  color: #1a1a1a;
  background: #fafafa;
}
```

- [ ] **Step 7: Write `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "사주 운세 앱",
  description: "년도별 운세 페이지",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Write `src/app/page.tsx`**

```tsx
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>사주 운세 앱</h1>
      <p>
        <Link href="/year-fortune/2026">2026년 운세 상세 보기 →</Link>
      </p>
    </main>
  );
}
```

- [ ] **Step 9: Install dependencies**

Run: `npm install` (from `C:\Users\Har22\Desktop\saju-fortune-app`)
Expected: installs without error, creates `node_modules` and `package-lock.json`

- [ ] **Step 10: Verify the project builds**

Run: `npm run build`
Expected: build succeeds (compiles `src/app/layout.tsx` and `src/app/page.tsx` with no type errors)

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs next-env.d.ts .gitignore src/app/layout.tsx src/app/globals.css src/app/page.tsx
git commit -m "chore: scaffold Next.js + TypeScript project"
```

---

## Task 2: Vitest/RTL setup + `SajuExtended` type + ganzhi core module

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `src/saju/types.ts`
- Create: `src/saju/mock/ganzhi.ts`
- Test: `src/saju/mock/ganzhi.test.ts`

**Interfaces:**
- Consumes: nothing external (foundational module)
- Produces:
  - `SajuExtended`, `GanZhi`, `CheonGan`, `JiJi` types from `src/saju/types.ts`
  - `Ohaeng`, `ElementRelation`, `CHEON_GAN`, `JI_JI`, `GAN_TO_OHAENG` from `src/saju/mock/ganzhi.ts`
  - `getYearGanZhi(year: number): GanZhi`
  - `getMonthInGanZhi(year: number, month: number): GanZhi` (mock — throws if `month` not in 1-12)
  - `getOhaengRelation(a: Ohaeng, b: Ohaeng): ElementRelation`
  - `getElementRelation(ganA: CheonGan, ganB: CheonGan): ElementRelation`
  - `ganZhiToHanja(gz: GanZhi): string`

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 2: Write `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Write `src/saju/types.ts`**

```ts
export type CheonGan = "갑" | "을" | "병" | "정" | "무" | "기" | "경" | "신" | "임" | "계";
export type JiJi = "자" | "축" | "인" | "묘" | "진" | "사" | "오" | "미" | "신" | "유" | "술" | "해";

export interface GanZhi {
  gan: CheonGan;
  ji: JiJi;
}

export interface SajuExtended {
  birthDate: string;
  calendarType: "solar" | "lunar";
  gender: "M" | "F";
  pillars: {
    year: GanZhi;
    month: GanZhi;
    day: GanZhi;
    hour: GanZhi | null;
  };
  dayMaster: CheonGan;
  ohaeng: Record<"목" | "화" | "토" | "금" | "수", number>;
}
```

- [ ] **Step 4: Write the failing test for `getYearGanZhi`**

Create `src/saju/mock/ganzhi.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getYearGanZhi } from "./ganzhi";

describe("getYearGanZhi", () => {
  it("returns 병오 for 2026", () => {
    expect(getYearGanZhi(2026)).toEqual({ gan: "병", ji: "오" });
  });

  it("returns 갑자 for 1984", () => {
    expect(getYearGanZhi(1984)).toEqual({ gan: "갑", ji: "자" });
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npx vitest run src/saju/mock/ganzhi.test.ts`
Expected: FAIL — `Cannot find module './ganzhi'` (file doesn't exist yet)

- [ ] **Step 6: Implement `getYearGanZhi` in `src/saju/mock/ganzhi.ts`**

```ts
import { CheonGan, JiJi, GanZhi } from "../types";

export type Ohaeng = "목" | "화" | "토" | "금" | "수";
export type ElementRelation = "generates" | "generated_by" | "controls" | "controlled_by" | "same";

export const CHEON_GAN: readonly CheonGan[] = [
  "갑", "을", "병", "정", "무", "기", "경", "신", "임", "계",
] as const;

export const JI_JI: readonly JiJi[] = [
  "자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해",
] as const;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function getYearGanZhi(year: number): GanZhi {
  const stemIndex = mod(year - 4, 10);
  const branchIndex = mod(year - 4, 12);
  return { gan: CHEON_GAN[stemIndex], ji: JI_JI[branchIndex] };
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run src/saju/mock/ganzhi.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 8: Add the failing test for `getMonthInGanZhi`**

Append to `src/saju/mock/ganzhi.test.ts`:

```ts
import { getMonthInGanZhi } from "./ganzhi";

describe("getMonthInGanZhi", () => {
  it("is deterministic for the same year and month", () => {
    const first = getMonthInGanZhi(2026, 3);
    const second = getMonthInGanZhi(2026, 3);
    expect(first).toEqual(second);
  });

  it("throws for a month outside 1-12", () => {
    expect(() => getMonthInGanZhi(2026, 13)).toThrow();
  });
});
```

(Merge this `import` with the existing one at the top of the file into a single `import { getYearGanZhi, getMonthInGanZhi } from "./ganzhi";`.)

- [ ] **Step 9: Run test to verify it fails**

Run: `npx vitest run src/saju/mock/ganzhi.test.ts`
Expected: FAIL — `getMonthInGanZhi is not a function`

- [ ] **Step 10: Implement `getMonthInGanZhi` (explicit mock)**

Append to `src/saju/mock/ganzhi.ts`:

```ts
// 목업: 실제 절기(24절기) 기반 계산이 아니라, 연간지에서 파생한 결정론적 더미값이다.
// TODO: 실제 사주 라이브러리(절기 기반 월주 계산)로 교체할 것.
export function getMonthInGanZhi(year: number, month: number): GanZhi {
  if (month < 1 || month > 12) {
    throw new Error(`month must be between 1 and 12, got ${month}`);
  }
  const yearStemIndex = CHEON_GAN.indexOf(getYearGanZhi(year).gan);
  const stemIndex = mod(yearStemIndex * 2 + month, 10);
  const branchIndex = mod(month + 1, 12);
  return { gan: CHEON_GAN[stemIndex], ji: JI_JI[branchIndex] };
}
```

- [ ] **Step 11: Run test to verify it passes**

Run: `npx vitest run src/saju/mock/ganzhi.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 12: Add the failing tests for element relations and hanja conversion**

Append to `src/saju/mock/ganzhi.test.ts`:

```ts
import { getOhaengRelation, getElementRelation, ganZhiToHanja } from "./ganzhi";

describe("getOhaengRelation", () => {
  it("returns same for identical elements", () => {
    expect(getOhaengRelation("목", "목")).toBe("same");
  });

  it("returns generates when a generates b", () => {
    expect(getOhaengRelation("목", "화")).toBe("generates");
  });

  it("returns generated_by when b generates a", () => {
    expect(getOhaengRelation("화", "목")).toBe("generated_by");
  });

  it("returns controls when a controls b", () => {
    expect(getOhaengRelation("목", "토")).toBe("controls");
  });

  it("returns controlled_by when b controls a", () => {
    expect(getOhaengRelation("토", "목")).toBe("controlled_by");
  });
});

describe("getElementRelation", () => {
  it("derives the relation from each gan's element (금 controls 목)", () => {
    expect(getElementRelation("경", "을")).toBe("controls");
  });
});

describe("ganZhiToHanja", () => {
  it("converts 병오 to 丙午", () => {
    expect(ganZhiToHanja({ gan: "병", ji: "오" })).toBe("丙午");
  });
});
```

(Merge all imports from `./ganzhi` at the top of the file into one import statement.)

- [ ] **Step 13: Run test to verify it fails**

Run: `npx vitest run src/saju/mock/ganzhi.test.ts`
Expected: FAIL — `getOhaengRelation is not a function` (and similar for the others)

- [ ] **Step 14: Implement element relations and hanja conversion**

Append to `src/saju/mock/ganzhi.ts`:

```ts
export const CHEON_GAN_HANJA: Record<CheonGan, string> = {
  갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊",
  기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸",
};

export const JI_JI_HANJA: Record<JiJi, string> = {
  자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳",
  오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥",
};

export const GAN_TO_OHAENG: Record<CheonGan, Ohaeng> = {
  갑: "목", 을: "목",
  병: "화", 정: "화",
  무: "토", 기: "토",
  경: "금", 신: "금",
  임: "수", 계: "수",
};

const GENERATES: Record<Ohaeng, Ohaeng> = {
  목: "화", 화: "토", 토: "금", 금: "수", 수: "목",
};

const CONTROLS: Record<Ohaeng, Ohaeng> = {
  목: "토", 토: "수", 수: "화", 화: "금", 금: "목",
};

export function getOhaengRelation(a: Ohaeng, b: Ohaeng): ElementRelation {
  if (a === b) return "same";
  if (GENERATES[a] === b) return "generates";
  if (CONTROLS[a] === b) return "controls";
  if (GENERATES[b] === a) return "generated_by";
  return "controlled_by";
}

export function getElementRelation(ganA: CheonGan, ganB: CheonGan): ElementRelation {
  return getOhaengRelation(GAN_TO_OHAENG[ganA], GAN_TO_OHAENG[ganB]);
}

export function ganZhiToHanja(gz: GanZhi): string {
  return `${CHEON_GAN_HANJA[gz.gan]}${JI_JI_HANJA[gz.ji]}`;
}
```

- [ ] **Step 15: Run test to verify it passes**

Run: `npx vitest run src/saju/mock/ganzhi.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 16: Commit**

```bash
git add vitest.config.ts vitest.setup.ts package.json package-lock.json src/saju/types.ts src/saju/mock/ganzhi.ts src/saju/mock/ganzhi.test.ts
git commit -m "feat: add SajuExtended type and ganzhi core module"
```

---

## Task 3: Domain and monthly scoring module

**Files:**
- Create: `src/saju/mock/scoring.ts`
- Test: `src/saju/mock/scoring.test.ts`

**Interfaces:**
- Consumes: `SajuExtended` from `../types`; `GAN_TO_OHAENG`, `Ohaeng`, `ElementRelation`, `getYearGanZhi`, `getMonthInGanZhi`, `getOhaengRelation` from `./ganzhi`
- Produces:
  - `Domain` type and `DOMAINS: readonly Domain[]` (order: 총운, 애정, 재물, 직업학업, 건강, 인간관계)
  - `computeDomainScores(chart: SajuExtended, year: number): Record<Domain, number>`
  - `computeOverallScore(scores: Record<Domain, number>): number`
  - `computeMonthlyScores(chart: SajuExtended, year: number): number[]` (length 12, index 0 = January)

- [ ] **Step 1: Write the failing tests**

Create `src/saju/mock/scoring.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeDomainScores, computeOverallScore, computeMonthlyScores, DOMAINS } from "./scoring";
import { SajuExtended } from "../types";

const testChart: SajuExtended = {
  birthDate: "1998-04-12",
  calendarType: "solar",
  gender: "F",
  pillars: {
    year: { gan: "무", ji: "인" },
    month: { gan: "을", ji: "묘" },
    day: { gan: "경", ji: "진" },
    hour: { gan: "병", ji: "술" },
  },
  dayMaster: "경",
  ohaeng: { 목: 2, 화: 1, 토: 2, 금: 2, 수: 1 },
};

describe("computeDomainScores", () => {
  it("returns a score between 1 and 5 for every domain", () => {
    const scores = computeDomainScores(testChart, 2026);
    for (const domain of DOMAINS) {
      expect(scores[domain]).toBeGreaterThanOrEqual(1);
      expect(scores[domain]).toBeLessThanOrEqual(5);
    }
  });

  it("is deterministic for the same chart and year", () => {
    const first = computeDomainScores(testChart, 2026);
    const second = computeDomainScores(testChart, 2026);
    expect(first).toEqual(second);
  });
});

describe("computeOverallScore", () => {
  it("averages and rounds the domain scores, clamped to 1-5", () => {
    expect(
      computeOverallScore({ 총운: 5, 애정: 5, 재물: 5, 직업학업: 5, 건강: 5, 인간관계: 5 })
    ).toBe(5);
    expect(
      computeOverallScore({ 총운: 1, 애정: 1, 재물: 1, 직업학업: 1, 건강: 1, 인간관계: 1 })
    ).toBe(1);
  });
});

describe("computeMonthlyScores", () => {
  it("returns 12 scores between 1 and 5", () => {
    const scores = computeMonthlyScores(testChart, 2026);
    expect(scores).toHaveLength(12);
    for (const score of scores) {
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(5);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/saju/mock/scoring.test.ts`
Expected: FAIL — `Cannot find module './scoring'`

- [ ] **Step 3: Implement `src/saju/mock/scoring.ts`**

```ts
import { SajuExtended } from "../types";
import { GAN_TO_OHAENG, Ohaeng, ElementRelation, getYearGanZhi, getMonthInGanZhi, getOhaengRelation } from "./ganzhi";

export type Domain = "총운" | "애정" | "재물" | "직업학업" | "건강" | "인간관계";

export const DOMAINS: readonly Domain[] = [
  "총운", "애정", "재물", "직업학업", "건강", "인간관계",
] as const;

const DOMAIN_ELEMENT: Record<Exclude<Domain, "총운">, Ohaeng> = {
  애정: "화",
  재물: "금",
  직업학업: "수",
  건강: "목",
  인간관계: "토",
};

// 휴리스틱 점수표: a(외부 오행: 세운/월운)가 b(기준 오행: 일간 또는 영역 오행)에
// 미치는 영향을 1~5점으로 환산한다. 실제 십성(十神) 로직이 아니라 v0.1 목업 매핑이다.
const RELATION_SCORE: Record<ElementRelation, number> = {
  generates: 5,
  same: 4,
  controlled_by: 3,
  generated_by: 2,
  controls: 1,
};

export function computeDomainScores(chart: SajuExtended, year: number): Record<Domain, number> {
  const yearElement = GAN_TO_OHAENG[getYearGanZhi(year).gan];
  const dayMasterElement = GAN_TO_OHAENG[chart.dayMaster];

  const scores = {} as Record<Domain, number>;
  for (const domain of DOMAINS) {
    const targetElement = domain === "총운" ? dayMasterElement : DOMAIN_ELEMENT[domain];
    scores[domain] = RELATION_SCORE[getOhaengRelation(yearElement, targetElement)];
  }
  return scores;
}

export function computeOverallScore(scores: Record<Domain, number>): number {
  const values = DOMAINS.map((domain) => scores[domain]);
  const average = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.max(1, Math.min(5, Math.round(average)));
}

export function computeMonthlyScores(chart: SajuExtended, year: number): number[] {
  const dayMasterElement = GAN_TO_OHAENG[chart.dayMaster];
  const scores: number[] = [];
  for (let month = 1; month <= 12; month++) {
    const monthElement = GAN_TO_OHAENG[getMonthInGanZhi(year, month).gan];
    scores.push(RELATION_SCORE[getOhaengRelation(monthElement, dayMasterElement)]);
  }
  return scores;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/saju/mock/scoring.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/saju/mock/scoring.ts src/saju/mock/scoring.test.ts
git commit -m "feat: add domain and monthly scoring heuristic"
```

---

## Task 4: Sample chart fixture + `StarRating` component

**Files:**
- Create: `src/saju/mock/sampleChart.ts`
- Create: `src/app/year-fortune/[year]/components/StarRating.tsx`
- Create: `src/app/year-fortune/[year]/components/StarRating.module.css`
- Test: `src/app/year-fortune/[year]/components/StarRating.test.tsx`

**Interfaces:**
- Consumes: `SajuExtended` from `@/saju/types`
- Produces:
  - `sampleChart: SajuExtended` from `src/saju/mock/sampleChart.ts`
  - `StarRating({ score }: { score: number })` component, renders `★`/`☆` string with `aria-label="{clamped}점 / 5점"`

- [ ] **Step 1: Write `src/saju/mock/sampleChart.ts`**

```ts
import { SajuExtended } from "../types";

export const sampleChart: SajuExtended = {
  birthDate: "1998-04-12",
  calendarType: "solar",
  gender: "F",
  pillars: {
    year: { gan: "무", ji: "인" },
    month: { gan: "을", ji: "묘" },
    day: { gan: "경", ji: "진" },
    hour: { gan: "병", ji: "술" },
  },
  dayMaster: "경",
  ohaeng: { 목: 2, 화: 1, 토: 2, 금: 2, 수: 1 },
};
```

- [ ] **Step 2: Write the failing test**

Create `src/app/year-fortune/[year]/components/StarRating.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StarRating } from "./StarRating";

describe("StarRating", () => {
  it("renders 3 filled and 2 empty stars for a score of 3", () => {
    render(<StarRating score={3} />);
    expect(screen.getByLabelText("3점 / 5점")).toHaveTextContent("★★★☆☆");
  });

  it("clamps scores above 5 down to 5 stars", () => {
    render(<StarRating score={9} />);
    expect(screen.getByLabelText("5점 / 5점")).toHaveTextContent("★★★★★");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/app/year-fortune/\[year\]/components/StarRating.test.tsx`
Expected: FAIL — `Cannot find module './StarRating'`

- [ ] **Step 4: Implement `StarRating.module.css`**

```css
.stars {
  color: #d4a017;
  font-size: 1.1rem;
  letter-spacing: 2px;
}
```

- [ ] **Step 5: Implement `StarRating.tsx`**

```tsx
import styles from "./StarRating.module.css";

export interface StarRatingProps {
  score: number;
}

export function StarRating({ score }: StarRatingProps) {
  const clamped = Math.max(0, Math.min(5, Math.round(score)));
  const stars = "★".repeat(clamped) + "☆".repeat(5 - clamped);
  return (
    <span className={styles.stars} aria-label={`${clamped}점 / 5점`}>
      {stars}
    </span>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/app/year-fortune/\[year\]/components/StarRating.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 7: Commit**

```bash
git add src/saju/mock/sampleChart.ts "src/app/year-fortune/[year]/components/StarRating.tsx" "src/app/year-fortune/[year]/components/StarRating.module.css" "src/app/year-fortune/[year]/components/StarRating.test.tsx"
git commit -m "feat: add sample chart fixture and StarRating component"
```

---

## Task 5: `YearNav` component (section 1 — 년도 네비)

**Files:**
- Create: `src/app/year-fortune/[year]/components/YearNav.tsx`
- Create: `src/app/year-fortune/[year]/components/YearNav.module.css`
- Test: `src/app/year-fortune/[year]/components/YearNav.test.tsx`

**Interfaces:**
- Consumes: `GanZhi` from `@/saju/types`; `ganZhiToHanja` from `@/saju/mock/ganzhi`; `StarRating` from `./StarRating`
- Produces: `YearNav({ year, yearGanZhi, overallScore, canGoPrev, canGoNext })` — renders `"{year}년 {hanja}"`, `StarRating`, and prev/next arrows (as `next/link` `Link`s to `/year-fortune/{year-1}` and `/year-fortune/{year+1}` when allowed, disabled `span`s otherwise)

- [ ] **Step 1: Write the failing test**

Create `src/app/year-fortune/[year]/components/YearNav.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { YearNav } from "./YearNav";

describe("YearNav", () => {
  it("shows the year, hanja ganzhi, and overall star rating", () => {
    render(
      <YearNav
        year={2026}
        yearGanZhi={{ gan: "병", ji: "오" }}
        overallScore={4}
        canGoPrev={true}
        canGoNext={true}
      />
    );
    expect(screen.getByText("2026년 丙午")).toBeInTheDocument();
    expect(screen.getByLabelText("4점 / 5점")).toBeInTheDocument();
  });

  it("hides the previous-year link when canGoPrev is false", () => {
    render(
      <YearNav
        year={2026}
        yearGanZhi={{ gan: "병", ji: "오" }}
        overallScore={4}
        canGoPrev={false}
        canGoNext={true}
      />
    );
    expect(screen.queryByLabelText("이전 해")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/year-fortune/\[year\]/components/YearNav.test.tsx`
Expected: FAIL — `Cannot find module './YearNav'`

- [ ] **Step 3: Implement `YearNav.module.css`**

```css
.nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 16px 0;
}

.arrow {
  font-size: 1.5rem;
  text-decoration: none;
  color: #1a1a1a;
  padding: 4px 12px;
}

.arrowDisabled {
  color: #ccc;
  pointer-events: none;
}

.title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.year {
  font-size: 1.25rem;
  font-weight: 700;
}
```

- [ ] **Step 4: Implement `YearNav.tsx`**

```tsx
import Link from "next/link";
import { GanZhi } from "@/saju/types";
import { ganZhiToHanja } from "@/saju/mock/ganzhi";
import { StarRating } from "./StarRating";
import styles from "./YearNav.module.css";

export interface YearNavProps {
  year: number;
  yearGanZhi: GanZhi;
  overallScore: number;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export function YearNav({ year, yearGanZhi, overallScore, canGoPrev, canGoNext }: YearNavProps) {
  return (
    <nav className={styles.nav} aria-label="연도 이동">
      {canGoPrev ? (
        <Link href={`/year-fortune/${year - 1}`} className={styles.arrow} aria-label="이전 해">
          ‹
        </Link>
      ) : (
        <span className={`${styles.arrow} ${styles.arrowDisabled}`} aria-hidden="true">
          ‹
        </span>
      )}
      <div className={styles.title}>
        <span className={styles.year}>
          {year}년 {ganZhiToHanja(yearGanZhi)}
        </span>
        <StarRating score={overallScore} />
      </div>
      {canGoNext ? (
        <Link href={`/year-fortune/${year + 1}`} className={styles.arrow} aria-label="다음 해">
          ›
        </Link>
      ) : (
        <span className={`${styles.arrow} ${styles.arrowDisabled}`} aria-hidden="true">
          ›
        </span>
      )}
    </nav>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/app/year-fortune/\[year\]/components/YearNav.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add "src/app/year-fortune/[year]/components/YearNav.tsx" "src/app/year-fortune/[year]/components/YearNav.module.css" "src/app/year-fortune/[year]/components/YearNav.test.tsx"
git commit -m "feat: add YearNav component"
```

---

## Task 6: `DomainStars` component (section 2 — 영역별 별점)

**Files:**
- Create: `src/app/year-fortune/[year]/components/DomainStars.tsx`
- Create: `src/app/year-fortune/[year]/components/DomainStars.module.css`
- Test: `src/app/year-fortune/[year]/components/DomainStars.test.tsx`

**Interfaces:**
- Consumes: `Domain` from `@/saju/mock/scoring`; `StarRating` from `./StarRating`
- Produces: `DomainStars({ scores: Record<Domain, number> })` — renders a 2×3 grid with all 6 domain labels in order 총운, 애정, 재물, 직업학업, 건강, 인간관계

- [ ] **Step 1: Write the failing test**

Create `src/app/year-fortune/[year]/components/DomainStars.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DomainStars } from "./DomainStars";

describe("DomainStars", () => {
  it("renders all 6 domain labels", () => {
    render(
      <DomainStars scores={{ 총운: 3, 애정: 4, 재물: 2, 직업학업: 5, 건강: 3, 인간관계: 4 }} />
    );
    for (const label of ["총운", "애정", "재물", "직업학업", "건강", "인간관계"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/year-fortune/\[year\]/components/DomainStars.test.tsx`
Expected: FAIL — `Cannot find module './DomainStars'`

- [ ] **Step 3: Implement `DomainStars.module.css`**

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px;
}

.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.label {
  font-size: 0.9rem;
  color: #555;
}
```

- [ ] **Step 4: Implement `DomainStars.tsx`**

```tsx
import { Domain } from "@/saju/mock/scoring";
import { StarRating } from "./StarRating";
import styles from "./DomainStars.module.css";

export interface DomainStarsProps {
  scores: Record<Domain, number>;
}

const DOMAIN_ORDER: Domain[] = ["총운", "애정", "재물", "직업학업", "건강", "인간관계"];

export function DomainStars({ scores }: DomainStarsProps) {
  return (
    <section className={styles.grid} aria-label="영역별 별점">
      {DOMAIN_ORDER.map((domain) => (
        <div key={domain} className={styles.cell}>
          <span className={styles.label}>{domain}</span>
          <StarRating score={scores[domain]} />
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/app/year-fortune/\[year\]/components/DomainStars.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 6: Commit**

```bash
git add "src/app/year-fortune/[year]/components/DomainStars.tsx" "src/app/year-fortune/[year]/components/DomainStars.module.css" "src/app/year-fortune/[year]/components/DomainStars.test.tsx"
git commit -m "feat: add DomainStars component"
```

---

## Task 7: `MonthlyFlow` component (section 3 — 월별 흐름 + 물음표 팝업)

**Files:**
- Create: `src/app/year-fortune/[year]/components/MonthlyFlow.tsx`
- Create: `src/app/year-fortune/[year]/components/MonthlyFlow.module.css`
- Test: `src/app/year-fortune/[year]/components/MonthlyFlow.test.tsx`

**Interfaces:**
- Consumes: `GanZhi` from `@/saju/types`; `ganZhiToHanja` from `@/saju/mock/ganzhi`
- Produces: `MonthlyFlow({ year, monthlyScores, monthlyGanZhi })` — Client Component. Renders 12 bars (height ∝ score, gold if `score >= 3` else pink) each labeled `"{n}월"`, plus a single "?" button next to the "월별 흐름" heading that toggles a popup listing `"{n}월 {hanja}"` for all 12 months.

- [ ] **Step 1: Write the failing test**

Create `src/app/year-fortune/[year]/components/MonthlyFlow.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MonthlyFlow } from "./MonthlyFlow";

const monthlyGanZhi = Array.from({ length: 12 }, () => ({
  gan: "갑" as const,
  ji: "자" as const,
}));

describe("MonthlyFlow", () => {
  it("renders 12 month labels and hides the popup by default", () => {
    render(
      <MonthlyFlow year={2026} monthlyScores={Array(12).fill(3)} monthlyGanZhi={monthlyGanZhi} />
    );
    expect(screen.getByText("1월")).toBeInTheDocument();
    expect(screen.getByText("12월")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("shows the 12-month ganzhi popup when the info button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MonthlyFlow year={2026} monthlyScores={Array(12).fill(3)} monthlyGanZhi={monthlyGanZhi} />
    );
    await user.click(screen.getByLabelText("월별 간지 보기"));
    const popup = screen.getByRole("list");
    expect(popup).toHaveTextContent("1월 甲子");
    expect(popup).toHaveTextContent("12월 甲子");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/year-fortune/\[year\]/components/MonthlyFlow.test.tsx`
Expected: FAIL — `Cannot find module './MonthlyFlow'`

- [ ] **Step 3: Implement `MonthlyFlow.module.css`**

```css
.section {
  padding: 16px;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.heading {
  font-size: 1rem;
  font-weight: 700;
}

.infoButton {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid #999;
  background: #fff;
  font-size: 0.75rem;
  line-height: 1;
  cursor: pointer;
}

.popup {
  list-style: none;
  margin-top: 8px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fafafa;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  font-size: 0.85rem;
}

.bars {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 120px;
  margin-top: 16px;
}

.barColumn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
}

.barGood {
  width: 100%;
  background: #d4a017;
  border-radius: 4px 4px 0 0;
}

.barCaution {
  width: 100%;
  background: #e8a0bb;
  border-radius: 4px 4px 0 0;
}

.barLabel {
  font-size: 0.7rem;
  color: #777;
  margin-top: 4px;
}
```

- [ ] **Step 4: Implement `MonthlyFlow.tsx`**

```tsx
"use client";

import { useState } from "react";
import { GanZhi } from "@/saju/types";
import { ganZhiToHanja } from "@/saju/mock/ganzhi";
import styles from "./MonthlyFlow.module.css";

export interface MonthlyFlowProps {
  year: number;
  monthlyScores: number[];
  monthlyGanZhi: GanZhi[];
}

const GOOD_THRESHOLD = 3;
const MAX_SCORE = 5;

export function MonthlyFlow({ year, monthlyScores, monthlyGanZhi }: MonthlyFlowProps) {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <section className={styles.section} aria-label="월별 흐름">
      <div className={styles.header}>
        <h3 className={styles.heading}>월별 흐름</h3>
        <button
          type="button"
          className={styles.infoButton}
          aria-label="월별 간지 보기"
          onClick={() => setShowPopup((prev) => !prev)}
        >
          ?
        </button>
      </div>

      {showPopup && (
        <ul className={styles.popup} role="list">
          {monthlyGanZhi.map((gz, i) => (
            <li key={i}>
              {i + 1}월 {ganZhiToHanja(gz)}
            </li>
          ))}
        </ul>
      )}

      <div className={styles.bars}>
        {monthlyScores.map((score, i) => (
          <div key={i} className={styles.barColumn}>
            <div
              className={score >= GOOD_THRESHOLD ? styles.barGood : styles.barCaution}
              style={{ height: `${(score / MAX_SCORE) * 100}%` }}
            />
            <span className={styles.barLabel}>{i + 1}월</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

(The `year` prop is currently unused inside the component but kept in the interface since it's part of the section's identity and later tasks — e.g. wiring from `YearFortuneDetail` — pass it through.)

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/app/year-fortune/\[year\]/components/MonthlyFlow.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add "src/app/year-fortune/[year]/components/MonthlyFlow.tsx" "src/app/year-fortune/[year]/components/MonthlyFlow.module.css" "src/app/year-fortune/[year]/components/MonthlyFlow.test.tsx"
git commit -m "feat: add MonthlyFlow component with 12-month ganzhi popup"
```

---

## Task 8: `GoodBadMonths` component (section 4 — 좋은/주의 시기)

**Files:**
- Create: `src/app/year-fortune/[year]/components/GoodBadMonths.tsx`
- Create: `src/app/year-fortune/[year]/components/GoodBadMonths.module.css`
- Test: `src/app/year-fortune/[year]/components/GoodBadMonths.test.tsx`

**Interfaces:**
- Consumes: nothing beyond plain `number[]`
- Produces: `GoodBadMonths({ monthlyScores: number[] })` — picks the index of the max score as the "추천" month and the index of the min score as the "주의" month (both 1-based)

- [ ] **Step 1: Write the failing test**

Create `src/app/year-fortune/[year]/components/GoodBadMonths.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GoodBadMonths } from "./GoodBadMonths";

describe("GoodBadMonths", () => {
  it("picks the highest-scoring month as the recommended month", () => {
    const scores = [1, 2, 3, 5, 3, 2, 1, 2, 3, 2, 1, 2];
    render(<GoodBadMonths monthlyScores={scores} />);
    expect(screen.getByText("4월")).toBeInTheDocument();
  });

  it("shows both the 추천 and 주의 badges", () => {
    const scores = [1, 2, 3, 5, 3, 2, 1, 2, 3, 2, 1, 2];
    render(<GoodBadMonths monthlyScores={scores} />);
    expect(screen.getByText("추천")).toBeInTheDocument();
    expect(screen.getByText("주의")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/year-fortune/\[year\]/components/GoodBadMonths.test.tsx`
Expected: FAIL — `Cannot find module './GoodBadMonths'`

- [ ] **Step 3: Implement `GoodBadMonths.module.css`**

```css
.section {
  display: flex;
  gap: 16px;
  padding: 16px;
}

.callout {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background: #f5f5f5;
}

.badgeGood {
  background: #d4a017;
  color: #fff;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
}

.badgeCaution {
  background: #e8a0bb;
  color: #fff;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
}
```

- [ ] **Step 4: Implement `GoodBadMonths.tsx`**

```tsx
import styles from "./GoodBadMonths.module.css";

export interface GoodBadMonthsProps {
  monthlyScores: number[];
}

export function GoodBadMonths({ monthlyScores }: GoodBadMonthsProps) {
  const pickMonth = monthlyScores.indexOf(Math.max(...monthlyScores)) + 1;
  const cautionMonth = monthlyScores.indexOf(Math.min(...monthlyScores)) + 1;

  return (
    <section className={styles.section} aria-label="좋은/주의 시기">
      <div className={styles.callout}>
        <span className={styles.badgeGood}>추천</span>
        <span>{pickMonth}월</span>
      </div>
      <div className={styles.callout}>
        <span className={styles.badgeCaution}>주의</span>
        <span>{cautionMonth}월</span>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/app/year-fortune/\[year\]/components/GoodBadMonths.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add "src/app/year-fortune/[year]/components/GoodBadMonths.tsx" "src/app/year-fortune/[year]/components/GoodBadMonths.module.css" "src/app/year-fortune/[year]/components/GoodBadMonths.test.tsx"
git commit -m "feat: add GoodBadMonths component"
```

---

## Task 9: `AiSummary` component (section 5 — AI 총평)

**Files:**
- Create: `src/app/year-fortune/[year]/components/AiSummary.tsx`
- Create: `src/app/year-fortune/[year]/components/AiSummary.module.css`
- Test: `src/app/year-fortune/[year]/components/AiSummary.test.tsx`

**Interfaces:**
- Consumes: nothing beyond a plain string
- Produces: `AiSummary({ summary: string })` — renders the string as-is inside a labeled section (no LLM call)

- [ ] **Step 1: Write the failing test**

Create `src/app/year-fortune/[year]/components/AiSummary.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AiSummary } from "./AiSummary";

describe("AiSummary", () => {
  it("renders the provided summary text", () => {
    render(<AiSummary summary="테스트 총평 문장입니다." />);
    expect(screen.getByText("테스트 총평 문장입니다.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/year-fortune/\[year\]/components/AiSummary.test.tsx`
Expected: FAIL — `Cannot find module './AiSummary'`

- [ ] **Step 3: Implement `AiSummary.module.css`**

```css
.section {
  padding: 16px;
}

.heading {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.text {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #333;
}
```

- [ ] **Step 4: Implement `AiSummary.tsx`**

```tsx
import styles from "./AiSummary.module.css";

export interface AiSummaryProps {
  summary: string;
}

export function AiSummary({ summary }: AiSummaryProps) {
  return (
    <section className={styles.section} aria-label="AI 총평">
      <h3 className={styles.heading}>AI 총평</h3>
      <p className={styles.text}>{summary}</p>
    </section>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/app/year-fortune/\[year\]/components/AiSummary.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 6: Commit**

```bash
git add "src/app/year-fortune/[year]/components/AiSummary.tsx" "src/app/year-fortune/[year]/components/AiSummary.module.css" "src/app/year-fortune/[year]/components/AiSummary.test.tsx"
git commit -m "feat: add AiSummary component"
```

---

## Task 10: Page route + `YearFortuneDetail` composer + integration test

**Files:**
- Create: `src/app/year-fortune/[year]/YearFortuneDetail.tsx`
- Create: `src/app/year-fortune/[year]/YearFortuneDetail.module.css`
- Create: `src/app/year-fortune/[year]/page.tsx`
- Test: `src/app/year-fortune/[year]/YearFortuneDetail.test.tsx`

**Interfaces:**
- Consumes: `SajuExtended` (`@/saju/types`); `sampleChart` (`@/saju/mock/sampleChart`); `getYearGanZhi`, `getMonthInGanZhi` (`@/saju/mock/ganzhi`); `computeDomainScores`, `computeOverallScore`, `computeMonthlyScores` (`@/saju/mock/scoring`); `YearNav`, `DomainStars`, `MonthlyFlow`, `GoodBadMonths`, `AiSummary` (`./components/*`)
- Produces: `YearFortuneDetail({ chart: SajuExtended; year: number; summary: string })` — the full 5-section page body; `/year-fortune/[year]` route rendering it with `sampleChart`

- [ ] **Step 1: Write the failing integration test**

Create `src/app/year-fortune/[year]/YearFortuneDetail.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { YearFortuneDetail } from "./YearFortuneDetail";
import { sampleChart } from "@/saju/mock/sampleChart";

describe("YearFortuneDetail", () => {
  it("renders all five sections for a given chart and year", () => {
    render(<YearFortuneDetail chart={sampleChart} year={2026} summary="테스트 총평입니다." />);
    expect(screen.getByText("2026년 丙午")).toBeInTheDocument();
    expect(screen.getByLabelText("영역별 별점")).toBeInTheDocument();
    expect(screen.getByLabelText("월별 흐름")).toBeInTheDocument();
    expect(screen.getByLabelText("좋은/주의 시기")).toBeInTheDocument();
    expect(screen.getByText("테스트 총평입니다.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/year-fortune/\[year\]/YearFortuneDetail.test.tsx`
Expected: FAIL — `Cannot find module './YearFortuneDetail'`

- [ ] **Step 3: Implement `YearFortuneDetail.module.css`**

```css
.page {
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
```

- [ ] **Step 4: Implement `YearFortuneDetail.tsx`**

```tsx
import { SajuExtended } from "@/saju/types";
import { getYearGanZhi, getMonthInGanZhi } from "@/saju/mock/ganzhi";
import { computeDomainScores, computeOverallScore, computeMonthlyScores } from "@/saju/mock/scoring";
import { YearNav } from "./components/YearNav";
import { DomainStars } from "./components/DomainStars";
import { MonthlyFlow } from "./components/MonthlyFlow";
import { GoodBadMonths } from "./components/GoodBadMonths";
import { AiSummary } from "./components/AiSummary";
import styles from "./YearFortuneDetail.module.css";

export interface YearFortuneDetailProps {
  chart: SajuExtended;
  year: number;
  summary: string;
}

export function YearFortuneDetail({ chart, year, summary }: YearFortuneDetailProps) {
  const yearGanZhi = getYearGanZhi(year);
  const domainScores = computeDomainScores(chart, year);
  const overallScore = computeOverallScore(domainScores);
  const monthlyScores = computeMonthlyScores(chart, year);
  const monthlyGanZhi = Array.from({ length: 12 }, (_, i) => getMonthInGanZhi(year, i + 1));

  const birthYear = new Date(chart.birthDate).getFullYear();
  const minYear = birthYear + 1;
  const maxYear = birthYear + 100;

  return (
    <div className={styles.page}>
      <YearNav
        year={year}
        yearGanZhi={yearGanZhi}
        overallScore={overallScore}
        canGoPrev={year > minYear}
        canGoNext={year < maxYear}
      />
      <DomainStars scores={domainScores} />
      <MonthlyFlow year={year} monthlyScores={monthlyScores} monthlyGanZhi={monthlyGanZhi} />
      <GoodBadMonths monthlyScores={monthlyScores} />
      <AiSummary summary={summary} />
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/app/year-fortune/\[year\]/YearFortuneDetail.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 6: Implement the page route `page.tsx`**

```tsx
import { sampleChart } from "@/saju/mock/sampleChart";
import { YearFortuneDetail } from "./YearFortuneDetail";

export default async function YearFortunePage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const sampleSummary =
    "올해는 대체로 안정적인 흐름 속에서 새로운 기회가 찾아오는 해입니다. 상반기에는 관계에서 오는 스트레스에 주의가 필요하지만, 하반기로 갈수록 재물운이 살아나며 성과로 이어질 가능성이 큽니다. 무리한 확장보다는 기존의 것을 다지는 데 집중하면 좋은 결과를 얻을 수 있습니다.";

  return <YearFortuneDetail chart={sampleChart} year={Number(year)} summary={sampleSummary} />;
}
```

- [ ] **Step 7: Run the full test suite**

Run: `npm run test`
Expected: PASS — all tests across every task pass

- [ ] **Step 8: Verify the production build succeeds**

Run: `npm run build`
Expected: build succeeds with no type errors

- [ ] **Step 9: Manually verify in the browser**

Run: `npm run dev`, then open `http://localhost:3000/year-fortune/2026`
Expected: page shows "2026년 丙午" with a star rating, a 2×3 domain grid, 12 monthly bars with a "?" next to the "월별 흐름" heading (clicking it shows a 12-month ganzhi list), a 추천/주의 month callout, and an AI 총평 paragraph. Stop the dev server afterward.

- [ ] **Step 10: Commit**

```bash
git add "src/app/year-fortune/[year]/YearFortuneDetail.tsx" "src/app/year-fortune/[year]/YearFortuneDetail.module.css" "src/app/year-fortune/[year]/YearFortuneDetail.test.tsx" "src/app/year-fortune/[year]/page.tsx"
git commit -m "feat: compose year-fortune detail page and wire up the route"
```
