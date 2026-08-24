// 원국(chart) → 상단 "용왕이 살펴본 그대" 표시값으로 변환하는 순수 함수.
// 캐릭터(일간)는 DAY_GAN_INFO 재사용, 칩은 원국 핵심을 요약.
import { DAY_GAN_INFO } from "../dashboard/constants";
import { type SajuExtended } from "../../saju";

export interface Identity {
  hanja: string;       // 일간 한자 (己)
  typeLabel: string;   // "기토 · 넓은 대지"
  tags: string;        // "#포용 #끈기 #현실감각"
  chips: string[];     // 스트립 칩 목록
}

export function deriveIdentity(chart: SajuExtended): Identity {
  const info = DAY_GAN_INFO[chart.dayGan];
  const hanja = chart.dayGan ?? "?";
  const typeLabel = info ? `${info.nameKr} · ${info.type}` : hanja;
  const tags = info ? info.tags.join(" ") : "";

  const chips: string[] = [];

  // 1) 오행 강·부족 (키: 木火土金水)
  const wx = Object.entries(chart.wuXingCount ?? {});
  if (wx.length) {
    const strong = wx.reduce((a, b) => (b[1] > a[1] ? b : a));
    const weak = wx.reduce((a, b) => (b[1] < a[1] ? b : a));
    if (strong[1] > 0) chips.push(`${strong[0]} 강 · ${weak[0]} 부족`);
  }

  // 2) 가장 발달한 십성 (키: 비겁/식상/재성/관성/인성)
  const ss = Object.entries(chart.shiShenCount ?? {});
  if (ss.length) {
    const top = ss.reduce((a, b) => (b[1] > a[1] ? b : a));
    if (top[1] > 0) chips.push(`${top[0]} 발달`);
  }

  // 3) 신살 (최대 4개)
  (chart.shenSha ?? []).slice(0, 4).forEach((s) => chips.push(s.name));

  // 4) 올해 세운
  if (chart.currentSeWun) {
    chips.push(`올해 ${chart.currentSeWun.ganZhi} · ${chart.currentSeWun.rel}`);
  }

  // 5) 현재 대운 (올해가 속한 구간, 없으면 첫 구간)
  const curYear = chart.currentSeWun?.year ?? new Date().getFullYear();
  const daYun = chart.daYun ?? [];
  const current =
    [...daYun].filter((d) => d.startYear <= curYear).sort((a, b) => b.startYear - a.startYear)[0] ?? daYun[0];
  if (current) chips.push(`대운 ${current.ganZhi}`);

  return { hanja, typeLabel, tags, chips };
}
