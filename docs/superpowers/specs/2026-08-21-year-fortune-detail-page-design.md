# 년도별 운세 상세 페이지 (②-1. 그 해 운세 상세) 설계

- 날짜: 2026-08-21
- 버전: v0.1 (low-fi 기획서 기반)

## 배경

대시보드에서 특정 연도의 운세를 자세히 보여주는 페이지. 여러 팀원이 각자 년도별 운세 페이지를
병렬로 만들 예정이라, 아래 두 원칙을 반드시 지킨다.

1. 각 페이지는 원국 데이터를 `chart: SajuExtended` prop으로 받는다. 전역 원국 보관소
   (Context/Zustand/localStorage 등)는 만들지 않는다 — 전역 상태 방식은 아직 미정(회의 안건).
2. 새 기능은 새 파일로 만든다. 기존 CSS는 재사용하고, 추가분만 새 CSS 파일로 만든다
   (현재는 프로젝트 초기라 기존 CSS가 없으므로, 이후 다른 페이지가 참고할 수 있는 클래스명
   관례만 맞춰둔다).

이번 작업은 프로젝트가 아직 없는 상태에서 시작하므로, 팀 공유 계약인 `src/saju/types.ts`도
이번에 처음 정의한다.

## 프로젝트 구조

- 신규 Next.js(App Router) + TypeScript 프로젝트: `C:\Users\Har22\Desktop\saju-fortune-app`
- 스타일: CSS Modules, 페이지 전용 새 CSS 파일만 추가

## 데이터 계약: `src/saju/types.ts`

```ts
export type CheonGan = '갑'|'을'|'병'|'정'|'무'|'기'|'경'|'신'|'임'|'계';
export type JiJi = '자'|'축'|'인'|'묘'|'진'|'사'|'오'|'미'|'신'|'유'|'술'|'해';

export interface GanZhi {
  gan: CheonGan;
  ji: JiJi;
}

export interface SajuExtended {
  birthDate: string;          // ISO date
  calendarType: 'solar' | 'lunar';
  gender: 'M' | 'F';
  pillars: {
    year: GanZhi;
    month: GanZhi;
    day: GanZhi;
    hour: GanZhi | null;      // 시간 모를 경우 null
  };
  dayMaster: CheonGan;        // 일간 (pillars.day.gan과 동일, 상생상극 계산에 자주 쓰여 별도 노출)
  ohaeng: Record<'목'|'화'|'토'|'금'|'수', number>; // 오행 분포
}
```

다른 팀원의 년도별 페이지도 동일 타입을 prop으로 받아 쓸 수 있다.

## 계산 로직 범위 (중요: 목업으로 처리)

세운/월운을 실제로 계산하는 사주 라이브러리가 아직 없다. 이번 작업 범위에서는:

- `getYearGanZhi(year)` (`src/saju/mock/ganzhi.ts`): 60갑자 공식은 단순 산술이므로 실제로
  맞게 계산한다 (`(year-4) % 10`, `(year-4) % 12`로 간지 인덱스 산출).
- `getMonthInGanZhi(year, month)` (같은 파일): **목업**. 결정론적 더미값을 반환하고, 파일
  상단에 `// TODO: 실제 사주 라이브러리로 교체` 주석을 명시한다. 실제 절기 계산은 이번
  범위에 포함하지 않는다.
- `getElementRelation(dayMaster, targetGan)` (`src/saju/mock/ganzhi.ts`): 일간과 대상 천간의
  오행 상생/상극/비화 관계를 반환하는 목업 매핑 테이블.

## 영역별 점수화 (`src/saju/mock/scoring.ts`)

- 대상 영역: 총운·애정·재물·직업학업·건강·인간관계 (6개, 1~5점)
- 오행 → 영역 가중치 테이블(예: 화=애정/명예, 금=재물, 목=건강 등)과 세운/월운의 오행 상생상극
  결과를 조합해 점수를 산출하는 휴리스틱 함수
- 실제 십성(十神) 로직이 아니라 임시 휴리스틱임을 파일 주석으로 명시

## 페이지 구성 (`app/year-fortune/[year]/page.tsx`)

컴포넌트는 `chart: SajuExtended`와 대상 `year`를 prop으로 받는다.

1. **년도 네비**: `‹ 2026년 丙午 ›` + 종합 별점. 좌우 화살표로 다른 해 이동 (세운 범위 내).
2. **영역별 별점**: 총운·애정·재물·직업학업·건강·인간관계 2×3 그리드.
3. **월별 흐름 12칸**: 막대 높이 = 점수, 금색 = 좋음, 분홍 = 주의.
   - "월별 흐름" 섹션 제목 옆에 물음표 아이콘 1개 (막대 개별 아이콘 아님).
   - 클릭 시 팝업으로 1~12월 월간지 전체 목록을 한 번에 표시
     (`getMonthInGanZhi(year, 1~12)` 결과 나열).
4. **좋은/주의 시기**: 픽(추천) 달 / 조심 달 콜아웃.
5. **AI 총평**: `summary: string` prop으로 받은 텍스트를 그대로 렌더링 (서술 3~4문장 +
   근거 인용은 이 prop 문자열 안에 포함되어 온다고 가정). 실제 LLM 연동은 이번 범위 밖.

## 데모/미리보기

온보딩 폼이 아직 없어 `chart` prop을 실제로 공급할 곳이 없으므로, 샘플 `SajuExtended`
목업 데이터를 하드코딩한 데모 페이지(`app/year-fortune/[year]/page.tsx`에서 정적 샘플
사용)로 브라우저에서 바로 확인할 수 있게 한다.

## 범위 밖 (Out of scope)

- 실제 만세력/절기 계산 라이브러리 구현
- 실제 십성 매핑 및 정밀 점수 산식
- AI 총평 실시간 생성 (LLM API 연동)
- 전역 원국 상태 관리 방식 결정 (별도 회의 안건)

## 테스트

- `getYearGanZhi`: 알려진 연도(예: 2026 → 丙午) 기준 단위 테스트
- `getMonthInGanZhi`, `getElementRelation`, 점수화 함수: 목업이므로 "항상 같은 입력 →
  같은 출력(결정론적)"만 검증
- 페이지 컴포넌트: 샘플 `chart`를 넘겼을 때 5개 섹션이 모두 렌더링되는지, 물음표 클릭 시
  12개월 목록 팝업이 뜨는지 확인
