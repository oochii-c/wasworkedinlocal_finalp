// server/prompt-utils.js
// AI 엔드포인트가 공유하는 유틸 + 용왕 페르소나.
// 천간·지지 표(GAN_INFO·ZHI_INFO)와 라벨 헬퍼의 단일 출처.

// 천간 -> [한글, 오행]. 모델이 한자를 오독하지 않도록 명시용.
export const GAN_INFO = {
  甲: ["갑", "목"], 乙: ["을", "목"], 丙: ["병", "화"], 丁: ["정", "화"], 戊: ["무", "토"],
  己: ["기", "토"], 庚: ["경", "금"], 辛: ["신", "금"], 壬: ["임", "수"], 癸: ["계", "수"],
};

// 지지 -> [한글음, 띠]. 천간과 마찬가지로 모델이 한자를 오독하지 않도록 명시용.
export const ZHI_INFO = {
  子: ["자", "쥐"], 丑: ["축", "소"], 寅: ["인", "호랑이"], 卯: ["묘", "토끼"],
  辰: ["진", "용"], 巳: ["사", "뱀"], 午: ["오", "말"], 未: ["미", "양"],
  申: ["신", "원숭이"], 酉: ["유", "닭"], 戌: ["술", "개"], 亥: ["해", "돼지"],
};

// ── 한자 표기 단일 기준: 모든 한자에 한글 음을 병기한다. ──
// 천간: 甲(갑·목)
export const ganLabel = (gan) => {
  const [kor, elem] = GAN_INFO[gan] || ["?", "?"];
  return `${gan}(${kor}·${elem})`;
};
// 지지: 午(오·말)
export const zhiLabel = (zhi) => {
  const [kor, zodiac] = ZHI_INFO[zhi] || ["?", "?"];
  return `${zhi}(${kor}·${zodiac})`;
};
// 지장간(천간 여러 개): 丁(정) 己(기) — 한글 음만 간결히.
export const hideGanLabel = (arr = []) =>
  arr.map((g) => `${g}(${(GAN_INFO[g] || ["?"])[0]})`).join(" ");
// 간지 2글자: 丙午(병오)
export const ganZhiLabel = (gz = "") => {
  const gk = (GAN_INFO[gz[0]] || ["?"])[0];
  const zk = (ZHI_INFO[gz[1]] || ["?"])[0];
  return `${gz}(${gk}${zk})`;
};

// 오행 분포 + 부족 오행 한 줄. (키 언어에 무관하게 entries 로 처리)
// 예: "木3 火4 土5 金1 水1 (부족: 金·水)" / 0개면 "없음: 金" / 전부 같으면 "고르게 분포"
export function wuXingLine(chart) {
  const entries = Object.entries(chart.wuXingCount || {});
  if (!entries.length) return "정보 없음";
  // 값은 개수가 아니라 가중 점수(소수). 프롬프트에 길게 흘리지 않도록 소수 1자리로 줄인다.
  const counts = entries.map(([k, v]) => `${k}${Math.round(v * 10) / 10}`).join(" ");
  const values = entries.map(([, v]) => v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // 전부 같은 개수면 최소값이 곧 최대값 — 이때 "부족"이라 하면 5개 전부 부족으로 나간다.
  if (min === max) return `${counts} (오행이 고르게 분포)`;
  const lacking = entries.filter(([, v]) => v === min).map(([k]) => k).join("·");
  return `${counts} (${min === 0 ? "없음" : "부족"}: ${lacking})`;
}

// 원국(chart)에 이미 계산돼 있는 정보를 최대한 담아 프롬프트용 텍스트로 변환.
// 모든 AI 엔드포인트(풀이·주제·상담)가 이 한 벌을 공유한다.
// (사주 계산 파일은 건드리지 않고, 여기서 serialize 만 풍부하게)
export function chartToText(chart) {
  // 기둥별 상세 (지장간·십신·십이운성·납음·공망 포함)
  const pillarLines = (chart.pillars || []).map(
    (p) =>
      `- ${p.key}주 ${ganZhiLabel(p.ganZhi)}: 천간 ${ganLabel(p.gan)}/십신 ${p.shiShenGan}, ` +
      `지지 ${zhiLabel(p.zhi)}/십신 ${(p.shiShenZhi || []).join("·")}, 지장간 ${hideGanLabel(p.hideGan)}, 오행 ${p.wuXing}, ` +
      `십이운성 ${p.diShi}, 납음 ${p.naYin}, 공망 ${p.xunKong}`
  );

  // 십신 분포
  const ssLine =
    Object.entries(chart.shiShenCount || {}).map(([k, v]) => `${k}${v}`).join(" ") || "정보 없음";

  // 신살 / 대운 흐름 / 올해 세운
  const shenSha = (chart.shenSha || []).map((s) => s.name).join(", ") || "특별한 신살 없음";
  const daYun =
    (chart.daYun || []).map((d) => `${d.startAge}세(${d.startYear})~${d.ganZhi}`).join(" / ") ||
    "정보 없음";
  const cur = chart.currentSeWun;
  const curLine = cur ? `${cur.year} ${cur.ganZhi} (일간과 ${cur.rel})` : "정보 없음";

  return [
    `[본인] 일간 ${ganLabel(chart.dayGan)} · 띠 ${chart.shengXiao} · 팔자 ${(chart.baZi || []).map(ganZhiLabel).join(" ")}`,
    `[원국 기둥]`,
    ...pillarLines,
    `[오행 분포(8자 + 지장간)] ${wuXingLine(chart)}`,
    `[십신 분포] ${ssLine}`,
    `[신살] ${shenSha}`,
    `[대운 흐름] ${daYun}`,
    `[올해 세운] ${curLine}`,
  ].join("\n");
}

// 모든 프롬프트 공용 — 사고·언어 규칙
export const LANG_RULE = `[사고·언어] 추론(사고 과정)은 영어로 진행하되, 사용자에게 출력하는 최종 답변(JSON 내 문자열 값 포함)은 반드시 자연스러운 한국어로 작성한다.`;
