/* ============================================================
   간체자 -> 한국식 번체자(정체자) 변환
   ============================================================ */
export const SIMPLIFIED_TO_TRADITIONAL: Record<string, string> = {
  "龙": "龍", "马": "馬", "鸡": "鷄",
  "猪": "豬", "鸟": "鳥", "鱼": "魚",
  "门": "門", "财": "財", "杀": "殺",
  "无": "無", "伤": "傷", "进": "進",
  "贵": "貴", "德": "德", "阳": "陽",
  "阴": "陰", "禄": "祿", "开": "開",
  "关": "關", "头": "頭", "极": "極",
  "长": "長", "见": "見", "带": "帶",
};

export function toTraditional(text: string): string {
  if (!text) return "";
  return text.split("").map(ch => SIMPLIFIED_TO_TRADITIONAL[ch] ?? ch).join("");
}

export function toTradArr(arr: string[]): string[] {
  if (!arr) return [];
  return arr.map(toTraditional);
}
