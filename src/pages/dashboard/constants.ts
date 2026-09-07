export interface DayGanInfo {
  nameKr: string;    // "기토"
  nameHanja: string; // "己土"
  type: string;
  element: string;
  tags: string[];
  color: string;
}

export const DAY_GAN_INFO: Record<string, DayGanInfo> = {
  甲: { nameKr: "갑목", nameHanja: "甲木", type: "우뚝 선 소나무", element: "木", tags: ["#선도력", "#의지", "#직진형"], color: "#3a7a3a" },
  乙: { nameKr: "을목", nameHanja: "乙木", type: "바람에 흔들리는 꽃", element: "木", tags: ["#유연", "#감수성", "#적응력"], color: "#5a9a5a" },
  丙: { nameKr: "병화", nameHanja: "丙火", type: "빛나는 태양", element: "火", tags: ["#열정", "#개방적", "#리더십"], color: "#c04040" },
  丁: { nameKr: "정화", nameHanja: "丁火", type: "은은한 촛불", element: "火", tags: ["#섬세함", "#직관", "#집중력"], color: "#d06050" },
  戊: { nameKr: "무토", nameHanja: "戊土", type: "광활한 산맥", element: "土", tags: ["#포용", "#신뢰", "#묵직함"], color: "#8a7030" },
  己: { nameKr: "기토", nameHanja: "己土", type: "넓은 대지", element: "土", tags: ["#포용", "#끈기", "#현실감각"], color: "#9a8040" },
  庚: { nameKr: "경금", nameHanja: "庚金", type: "날카로운 검", element: "金", tags: ["#결단력", "#의리", "#강직"], color: "#7a7a8a" },
  辛: { nameKr: "신금", nameHanja: "辛金", type: "보석처럼 빛나는", element: "金", tags: ["#섬세함", "#완벽주의", "#예리함"], color: "#9090a0" },
  壬: { nameKr: "임수", nameHanja: "壬水", type: "깊고 넓은 바다", element: "水", tags: ["#지략", "#포용", "#흐름"], color: "#3060a0" },
  癸: { nameKr: "계수", nameHanja: "癸水", type: "맑은 샘물", element: "水", tags: ["#직관", "#감수성", "#지혜"], color: "#5070b0" },
};

// 천간(10간) · 지지(12지) 한글 독음 매핑
export const HANJA_DOK: Record<string, string> = {
  // 10간
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
  己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
  // 12지
  子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사",
  午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
};

// 용궁 다크 테마 오행 배경색
export const WUXING_BG: Record<string, string> = {
  木: "rgba(58,122,58,0.25)",
  火: "rgba(192,64,64,0.25)",
  土: "rgba(154,128,64,0.22)",
  金: "rgba(160,160,180,0.22)",
  水: "rgba(48,96,160,0.28)",
};

export const WUXING_BORDER: Record<string, string> = {
  木: "rgba(90,154,90,0.5)",
  火: "rgba(208,96,80,0.5)",
  土: "rgba(180,160,80,0.5)",
  金: "rgba(180,180,200,0.45)",
  水: "rgba(80,112,180,0.5)",
};

export const WUXING_TEXT: Record<string, string> = {
  木: "#7fc87f",
  火: "#e08080",
  土: "#d4b86a",
  金: "#c8c8d8",
  水: "#7090c8",
};

// 오행 SVG 색상 (오각별)
export const WUXING_SVG_COLOR: Record<string, string> = {
  木: "#5a9a5a",
  火: "#d06060",
  土: "#c8a840",
  金: "#9898a8",
  水: "#5070b0",
};

export const SIPSHEN_LABELS = ["비겁", "식상", "재성", "관성", "인성"] as const;
export type SipshenLabel = typeof SIPSHEN_LABELS[number];

export const SIPSHEN_COLOR: Record<string, string> = {
  비겁: "#EACB8A",
  식상: "#7fc87f",
  재성: "#d06060",
  관성: "#a8a8bc",
  인성: "#7e9fe0",
};

// 오행 버블 축 천장 = 이 비율이면 최대 크기에 도달.
// 불변식: strengthLabel의 "풍부한" 기준(0.30) 이상이어야 함(더 낮추면 "끝에 닿았는데 적당한" 모순 발생).
// 0.30 = 최저 경계값(끝에 닿음 ⟺ 정확히 "풍부한")이라 안전.
export const GRAPH_FULL_SHARE = 0.30;

// 전체합 대비 비율로 강약 라벨 산출 (오행 전용)
export function strengthLabel(cnt: number, total: number): string {
  if (cnt === 0) return NEEDS_FILL_LABEL;
  const share = total > 0 ? cnt / total : 0;
  if (share >= 0.30) return "풍부한";
  if (share >= 0.15) return "적당한";
  return "적은";
}

/* ------------------------------------------------------------
   십성 강약 — 오행과 분리한 이유
   오행은 지장간 구성상 土가 평균 27%를 먹는 등 오행마다 기대값이 다르고,
   값도 가중 점수(소수)다. 십성은 다섯 분류의 기대값이 모두 균등선(1/5)에
   붙어 있어(측정: 19.8~20.1%) "균등 대비 몇 배인가"로 재는 게 맞다.
   고정 share 임계값(0.30/0.15)을 그대로 쓰면 0.15~0.30 밴드가 확률질량
   대부분을 삼켜 사주 절반 이상이 "적당한" 3개 이상을 받았다.
   ------------------------------------------------------------ */
export const SIPSHEN_EVEN_SHARE = 1 / SIPSHEN_LABELS.length; // 균등선 0.20

// 균등 대비 배율. 1.0 = 딱 균등, 2.0 = 균등의 두 배.
export function sipshenRatio(cnt: number, total: number): number {
  return total > 0 ? cnt / total / SIPSHEN_EVEN_SHARE : 0;
}

// 레이더 축 끝(= fill 1.0)에 닿는 배율. 균등이면 정확히 축 중간(0.5)에 온다.
export const SIPSHEN_FULL_RATIO = 2.0;

// 0이어도 완전히 찌그러지지 않도록 남기는 최소 반지름 비율
export const SIPSHEN_MIN_FILL = 0.06;

export function sipshenStrengthLabel(cnt: number, total: number): string {
  if (cnt === 0) return NEEDS_FILL_LABEL;
  const r = sipshenRatio(cnt, total);
  if (r >= 1.4) return "풍부한";
  if (r >= 0.7) return "적당한";
  return "적은";
}

// "{대상}{조사} {강도} 사주예요" 문장에서 쓰는 조사.
// "채워야 하는"만 대상을 목적어로 받아 을/를을 쓴다("재성을 채워야 하는").
// 나머지 강도는 대상이 주어라 이/가다("재성이 풍부한").
// 붙는 말(십성 5종·"기운")이 모두 받침으로 끝나 을/이 한 벌로 충분하다.
export const NEEDS_FILL_LABEL = "채워야 하는";

export function strengthParticle(strength: string): string {
  return strength === NEEDS_FILL_LABEL ? "을" : "이";
}
