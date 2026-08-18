import { type Pillar, type ShenShaInfo } from "./types";

/* ============================================================
   신살(神煞) 및 십성 매핑 & 계산
   ============================================================ */
export const SIPSHEN_GROUP: Record<string, string> = {
  比肩: "비겁", 劫財: "비겁",
  食神: "식상", 傷官: "식상",
  偏財: "재성", 正財: "재성",
  偏官: "관성", 正官: "관성", 七殺: "관성",
  偏印: "인성", 正印: "인성",
  日主: "비겁",
};

export const SHENSHA_DESC: Record<string, string> = {
  도화살: "이성에게 매력을 어필하는 기운",
  역마살: "이동·여행·변화의 기운",
  천을귀인: "위기 때 귀인이 나타나는 기운",
  백호살: "강한 기운, 사고나 변동 주의",
  양인살: "강한 기세, 주도성이 강함",
  천덕귀인: "하늘의 덕을 받는 길성",
  월덕귀인: "인덕이 있는 길성",
};

export function calcShenSha(pillars: Pillar[], dayGan: string): ShenShaInfo[] {
  const yearZhi = pillars[0]?.zhi ?? "";
  const allZhis = pillars.map(p => p.zhi);
  const result: ShenShaInfo[] = [];

  const DOHWA: Record<string, string> = {
    寅: "卯", 午: "卯", 戌: "卯",
    巳: "午", 酉: "午", 丑: "午",
    申: "酉", 子: "酉", 辰: "酉",
    亥: "子", 卯: "子", 未: "子",
  };
  if (DOHWA[yearZhi] && allZhis.slice(1).includes(DOHWA[yearZhi])) {
    result.push({ name: "도화살", desc: SHENSHA_DESC["도화살"] });
  }

  const YUKMA: Record<string, string> = {
    寅: "申", 午: "申", 戌: "申",
    申: "寅", 子: "寅", 辰: "寅",
    巳: "亥", 酉: "亥", 丑: "亥",
    亥: "巳", 卯: "巳", 未: "巳",
  };
  if (YUKMA[yearZhi] && allZhis.slice(1).includes(YUKMA[yearZhi])) {
    result.push({ name: "역마살", desc: SHENSHA_DESC["역마살"] });
  }

  const TIANYI: Record<string, string[]> = {
    甲: ["丑", "未"], 戊: ["丑", "未"],
    乙: ["子", "申"], 己: ["子", "申"],
    丙: ["亥", "酉"], 丁: ["亥", "酉"],
    庚: ["丑", "未"],
    辛: ["寅", "午"],
    壬: ["巳", "卯"], 癸: ["巳", "卯"],
  };
  if ((TIANYI[dayGan] ?? []).some(z => allZhis.includes(z))) {
    result.push({ name: "천을귀인", desc: SHENSHA_DESC["천을귀인"] });
  }

  const YANGREN: Record<string, string> = {
    甲: "卯", 乙: "寅", 丙: "午", 丁: "巳",
    戊: "午", 己: "巳", 庚: "酉", 辛: "申",
    壬: "子", 癸: "亥",
  };
  if (YANGREN[dayGan] && allZhis.includes(YANGREN[dayGan])) {
    result.push({ name: "양인살", desc: SHENSHA_DESC["양인살"] });
  }

  return result;
}
