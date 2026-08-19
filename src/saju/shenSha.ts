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

const GAN_LIST = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const ZHI_LIST = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

/*
 * 삼합국(三合局) 그룹 판별
 * 연지가 어느 삼합 오행에 속하는지로 12신살 기준지를 결정
 * 寅午戌=火局, 巳酉丑=金局, 申子辰=水局, 亥卯未=木局
 */
function sanHapGroup(zhi: string): "火" | "金" | "水" | "木" | null {
  if (["寅","午","戌"].includes(zhi)) return "火";
  if (["巳","酉","丑"].includes(zhi)) return "金";
  if (["申","子","辰"].includes(zhi)) return "水";
  if (["亥","卯","未"].includes(zhi)) return "木";
  return null;
}

/*
 * 12신살 지지 매핑 (연지 삼합국 → 각 신살의 해당 지지)
 * 삼합 생지(生地)를 지살로 시작해 순행 12지지 배치
 */
const SHISHA_ZHI: Record<string, Record<string, string>> = {
  火: { 겁살:"亥", 재살:"子", 천살:"丑", 지살:"寅", 년살:"卯", 월살:"辰", 망신살:"巳", 장성살:"午", 반안살:"未", 역마살:"申", 육해살:"酉", 화개살:"戌" },
  金: { 겁살:"寅", 재살:"卯", 천살:"辰", 지살:"巳", 년살:"午", 월살:"未", 망신살:"申", 장성살:"酉", 반안살:"戌", 역마살:"亥", 육해살:"子", 화개살:"丑" },
  水: { 겁살:"巳", 재살:"午", 천살:"未", 지살:"申", 년살:"酉", 월살:"戌", 망신살:"亥", 장성살:"子", 반안살:"丑", 역마살:"寅", 육해살:"卯", 화개살:"辰" },
  木: { 겁살:"申", 재살:"酉", 천살:"戌", 지살:"亥", 년살:"子", 월살:"丑", 망신살:"寅", 장성살:"卯", 반안살:"辰", 역마살:"巳", 육해살:"午", 화개살:"未" },
};

/*
 * 공망(空亡) 계산
 * 60갑자에서 10天干이 소진된 후 남는 2地支가 공망
 * 예) 甲子순 → 甲子~癸酉(10주) → 戌·亥 공망
 */
function calcKongWang(yearGan: string, yearZhi: string): string[] {
  const gi = GAN_LIST.indexOf(yearGan);
  const zi = ZHI_LIST.indexOf(yearZhi);
  if (gi < 0 || zi < 0) return [];
  // 이 연간지가 속한 순(旬)의 시작 地支 계산
  const zhiStart = (zi - gi + 120) % 12;
  return [ZHI_LIST[(zhiStart + 10) % 12], ZHI_LIST[(zhiStart + 11) % 12]];
}

export const SHENSHA_HANJA: Record<string, string> = {
  지살:     "地殺",
  도화살:   "桃花殺",
  월살:     "月殺",
  망신살:   "亡身殺",
  장성살:   "將星殺",
  반안살:   "攀鞍殺",
  역마살:   "驛馬殺",
  육해살:   "六害殺",
  화개살:   "華蓋殺",
  겁살:     "劫殺",
  재살:     "災殺",
  천살:     "天殺",
  천을귀인: "天乙貴人",
  천덕귀인: "天德貴人",
  월덕귀인: "月德貴人",
  문창귀인: "文昌貴人",
  홍염살:   "紅艶殺",
  양인살:   "羊刃殺",
  백호살:   "白虎殺",
  괴강살:   "魁罡殺",
  공망:     "空亡",
  태극귀인: "太極貴人",
  현침살:   "懸針殺",
  낙정관살: "落井關殺",
  귀문관살: "鬼門關殺",
  원진살:   "怨嗔殺",
  학당귀인: "學堂貴人",
  천의성:   "天醫星",
  고란살:   "孤鸞殺",
  협록:     "夾祿",
};

export const SHENSHA_DESC: Record<string, string> = {
  // ── 12신살 ──
  지살:     "새로운 시작과 개척의 기운. 활동력이 강하고 주도적으로 길을 열어가요.",
  도화살:   "이성에게 매력을 어필하는 기운. 사교성이 뛰어나고 인기가 많아요.",
  월살:     "어둠 속에서 달빛을 만나는 기운. 인내심과 지혜로 위기를 기회로 바꿔요.",
  망신살:   "자신을 드러내는 강력한 표현력. 실수를 줄이고 언행에 신중함이 필요해요.",
  장성살:   "리더십과 권위의 기운. 조직이나 분야에서 중심이 되어 이끄는 힘이 있어요.",
  반안살:   "말 안장에 오르는 길성. 시험·승진·명예운이 따르고 안정적인 결실을 맺어요.",
  역마살:   "이동·여행·변화의 기운. 활동 반경이 넓고 새로운 환경에 빠르게 적응해요.",
  육해살:   "빠른 속도와 예민한 직관력. 컨디션 관리와 신중한 선택이 도움이 돼요.",
  화개살:   "예술·학문·종교적 기운. 창의력이 풍부하고 내면의 깊이가 남달라요.",
  겁살:     "도전과 경쟁의 기운. 큰 성취를 이룰 수 있지만 무리한 투자는 피해요.",
  재살:     "임기응변과 뛰어난 두뇌 회전. 지략과 전략으로 난관을 극복해요.",
  천살:     "하늘의 뜻과 마주하는 기운. 순리를 따르고 때를 기다리는 지혜가 필요해요.",

  // ── 길성 및 특수 신살 ──
  천을귀인: "위기 때 귀인이 나타나는 최고 길성. 어려울수록 뜻밖의 도움을 받아요.",
  천덕귀인: "하늘의 덕을 받는 길성. 흉함을 길함으로 바꾸고 복이 따라와요.",
  월덕귀인: "인덕이 있는 길성. 주변 사람들의 따뜻한 협조와 지지를 받아요.",
  문창귀인: "학문과 창작의 길성. 총명하고 글재주, 지식 습득 능력이 뛰어나요.",
  홍염살:   "다정하고 은근한 매력. 사람의 마음을 자연스럽게 사로잡는 친밀감이 있어요.",
  양인살:   "강한 기세와 불굴의 추진력. 카리스마가 넘치며 전문 분야에서 두각을 나타내요.",
  백호살:   "강한 집중력과 폭발력. 결단력이 탁월하며 돌발 상황에 주의하면 대성해요.",
  괴강살:   "우두머리의 기질과 강한 리더십. 총명하고 결단력이 있어 큰일을 해내요.",
  공망:     "기운이 비어있는 자리. 세속적 욕심을 비우고 독창적인 길을 가면 유리해요.",
  태극귀인: "천지 음양의 기운을 온전히 갖춘 길성. 큰 위기에서도 반드시 재기하는 강한 회복력이 있어요.",
  현침살:   "날카로운 바늘처럼 예민하고 섬세한 기운. 의료·예술·기술 분야에서 두각을 나타낼 수 있어요.",
  낙정관살: "뜻밖의 구설이나 함정에 빠질 수 있는 기운. 언행과 처신을 신중히 하면 화를 피할 수 있어요.",
  귀문관살: "신비롭고 독특한 사고방식. 직관과 예감이 뛰어나며 종교·철학·심리 분야에 강한 기질이 있어요.",
  원진살:   "서로 끌리면서도 갈등하는 기운. 가까운 사람과 오해와 감정 충돌이 생기기 쉬우니 소통이 중요해요.",
  학당귀인: "학문과 배움의 복이 따르는 길성. 공부·교육·연구 분야에서 성과를 내기 쉬워요.",
  천의성:   "치유와 의료의 기운. 남을 돕고 치료하는 적성이 있으며 의료·상담 분야에 인연이 있어요.",
  고란살:   "배우자와 인연이 늦거나 독립적인 삶을 걷는 기운. 자유로운 개인 영역을 소중히 여겨요.",
  협록:     "일간의 록이 사주 안에 숨겨진 길성. 겉으로 드러나진 않지만 든든한 내공과 재력이 쌓여요.",
};

export function calcShenSha(pillars: Pillar[], dayGan: string): ShenShaInfo[] {
  const yearZhi  = pillars[0]?.zhi ?? "";
  const yearGan  = pillars[0]?.gan ?? "";
  const monthZhi = pillars[1]?.zhi ?? "";

  const allZhis     = pillars.map(p => p.zhi);              // 4기둥 지지 전체
  const allGans     = pillars.map(p => p.gan);              // 4기둥 천간 전체
  const allGanZhis  = pillars.flatMap(p => [p.gan, p.zhi]); // 4기둥 천간+지지 전체
  const otherZhis   = allZhis.slice(1);                     // 연지 제외 (월/일/시 지지)

  const result: ShenShaInfo[] = [];
  function push(name: string) {
    if (!result.some(r => r.name === name)) {
      result.push({ name, hanja: SHENSHA_HANJA[name], desc: SHENSHA_DESC[name] ?? "" });
    }
  }

  // ── 1. 삼합국 기반 12신살 (연지 + 일지 두 기준, 만세력 앱과 동일 방식) ──
  const dayZhi = pillars[2]?.zhi ?? "";
  // 12신살 키 → 표시 이름 (년살은 도화살로 표기)
  const SHISHA_NAME: Record<string, string> = { 년살: "도화살" };
  function applyShiSha(refZhi: string) {
    const g = sanHapGroup(refZhi);
    if (!g) return;
    const m = SHISHA_ZHI[g];
    for (const [key, zhi] of Object.entries(m)) {
      if (allZhis.includes(zhi)) push(SHISHA_NAME[key] ?? key);
    }
  }
  applyShiSha(yearZhi);  // 연지 기준
  applyShiSha(dayZhi);   // 일지 기준

  // ── 2. 일간(日干) 기준 길성 & 신살 ──

  // 천을귀인: 일간에 따라 정해진 지지가 4기둥 지지에 있으면 성립
  const TIANYI: Record<string, string[]> = {
    甲: ["丑","未"], 戊: ["丑","未"],
    乙: ["子","申"], 己: ["子","申"],
    丙: ["亥","酉"], 丁: ["亥","酉"],
    庚: ["丑","未"], 辛: ["寅","午"],
    壬: ["巳","卯"], 癸: ["巳","卯"],
  };
  if ((TIANYI[dayGan] ?? []).some(z => allZhis.includes(z))) push("천을귀인");

  // 문창귀인: 일간의 식신 건록지(학문·글재주 길성)
  const WENCHANG: Record<string, string> = {
    甲: "巳", 乙: "午",
    丙: "申", 戊: "申",
    丁: "酉", 己: "酉",
    庚: "亥", 辛: "子",
    壬: "寅", 癸: "卯",
  };
  if (WENCHANG[dayGan] && allZhis.includes(WENCHANG[dayGan])) push("문창귀인");

  // 홍염살: 은근한 이성 매력과 다정다감함
  const HONGYEOM: Record<string, string[]> = {
    甲: ["午"], 乙: ["午"],
    丙: ["寅"], 丁: ["未"],
    戊: ["辰"], 己: ["辰"],
    庚: ["戌"], 辛: ["酉"],
    壬: ["子", "申"], 癸: ["申"],
  };
  if ((HONGYEOM[dayGan] ?? []).some(z => allZhis.includes(z))) push("홍염살");

  // 양인살: 일간의 제왕지(帝旺支)가 4기둥 지지에 있으면 성립
  const YANGREN: Record<string, string> = {
    甲: "卯", 乙: "寅", 丙: "午", 丁: "巳",
    戊: "午", 己: "巳", 庚: "酉", 辛: "申",
    壬: "子", 癸: "亥",
  };
  if (YANGREN[dayGan] && allZhis.includes(YANGREN[dayGan])) push("양인살");

  // ── 3. 간지(기둥) 자체 구성 기준 특수 신살 ──

  // 백호살(백호대살): 4기둥 중 해당 간지가 존재하는지 검사
  const BAEKHO = ["甲辰", "乙未", "丙戌", "丁丑", "戊辰", "壬戌", "癸丑"];
  if (pillars.some(p => BAEKHO.includes(p.ganZhi))) push("백호살");

  // 괴강살: 4기둥 중 우두머리 카리스마 간지가 존재하는지 검사
  const GOEGANG = ["庚辰", "庚戌", "壬辰", "壬戌", "戊戌", "戊辰"];
  if (pillars.some(p => GOEGANG.includes(p.ganZhi))) push("괴강살");

  // ── 4. 월지(月支) 기준 귀인 길성 ──

  // 천덕귀인: 월지에 따라 정해진 천간·지지가 4기둥 어딘가에 있으면 성립
  const TIANDE: Record<string, string> = {
    寅: "丁", 卯: "申", 辰: "壬", 巳: "辛", 午: "亥", 未: "甲",
    申: "癸", 酉: "寅", 戌: "丙", 亥: "乙", 子: "巳", 丑: "庚",
  };
  if (TIANDE[monthZhi] && allGanZhis.includes(TIANDE[monthZhi])) push("천덕귀인");

  // 월덕귀인: 월지의 삼합국에서 정해진 천간이 4기둥 천간에 있으면 성립
  const YUEDE: Record<string, string> = {
    寅: "丙", 午: "丙", 戌: "丙",
    巳: "庚", 酉: "庚", 丑: "庚",
    申: "壬", 子: "壬", 辰: "壬",
    亥: "甲", 卯: "甲", 未: "甲",
  };
  if (YUEDE[monthZhi] && allGans.includes(YUEDE[monthZhi])) push("월덕귀인");

  // ── 5. 연간지(年干支) 기준 신살 ──

  // 공망: 연간지의 순중공망 지지가 월/일/시 지지에 있으면 성립
  const kongWang = calcKongWang(yearGan, yearZhi);
  if (kongWang.some(k => otherZhis.includes(k))) push("공망");

  // ── 6. 일간(日干) 기준 길성 ──

  // 태극귀인: 일간에 따라 정해진 지지가 4기둥 지지에 있으면 성립 (일간 기준 표준 공식)
  const TAEGEUK_ILGAN: Record<string, string[]> = {
    甲: ["子","午"], 乙: ["子","午"],
    丙: ["卯","酉"], 丁: ["卯","酉"],
    戊: ["辰","戌","丑","未"], 己: ["辰","戌","丑","未"],
    庚: ["寅","亥"], 辛: ["寅","亥"],
    壬: ["巳","申"], 癸: ["巳","申"],
  };
  if ((TAEGEUK_ILGAN[dayGan] ?? []).some(z => allZhis.includes(z))) push("태극귀인");

  // ── 7. 천간(天干) 기준 신살 ──

  // 현침살: 4기둥 천간에 甲·辛·丁 중 하나라도 있으면 성립 (바늘 형태 천간)
  const HYUNCHIM_GAN = ["甲","辛","丁"];
  if (allGans.some(g => HYUNCHIM_GAN.includes(g))) push("현침살");

  // ── 8. 월지(月支) 기준 신살 추가 ──

  // 낙정관살: 일간을 기준으로 정해진 지지가 4기둥 지지에 있으면 성립 (일간 기준 표준 공식)
  const NACKJEONG_ILGAN: Record<string, string> = {
    甲:"巳", 己:"巳",
    乙:"子", 庚:"子",
    丙:"申", 辛:"申",
    丁:"戌", 壬:"戌",
    戊:"卯", 癸:"卯",
  };
  if (NACKJEONG_ILGAN[dayGan] && allZhis.includes(NACKJEONG_ILGAN[dayGan])) push("낙정관살");

  // 천의성: 월지의 대칭 지지가 4기둥에 있으면 성립 (치유·의료 기운)
  const CHEONUI: Record<string, string> = {
    子:"丑", 丑:"子", 寅:"亥", 卯:"戌",
    辰:"酉", 巳:"申", 午:"未", 未:"午",
    申:"巳", 酉:"辰", 戌:"卯", 亥:"寅",
  };
  if (CHEONUI[monthZhi] && allZhis.includes(CHEONUI[monthZhi])) push("천의성");

  // ── 9. 지지(地支) 조합 신살 ──

  // 귀문관살: 4기둥에 특정 지지 쌍이 공존하면 성립 (신비·직관의 기운)
  const GWIMUN_PAIRS: [string,string][] = [
    ["子","酉"],["丑","午"],["寅","未"],["卯","申"],["辰","亥"],["巳","戌"],
  ];
  if (GWIMUN_PAIRS.some(([a,b]) => allZhis.includes(a) && allZhis.includes(b))) push("귀문관살");

  // 원진살: 4기둥에 특정 지지 쌍이 공존하면 성립 (갈등·반목의 기운)
  const WONJIN_PAIRS: [string,string][] = [
    ["子","未"],["丑","午"],["寅","酉"],["卯","申"],["辰","亥"],["巳","戌"],
  ];
  if (WONJIN_PAIRS.some(([a,b]) => allZhis.includes(a) && allZhis.includes(b))) push("원진살");

  // 학당귀인: 일간에 따른 학문의 지지가 4기둥에 있으면 성립
  const HAKDANG: Record<string,string> = {
    甲:"亥", 乙:"午", 丙:"寅", 丁:"酉",
    戊:"申", 己:"卯", 庚:"巳", 辛:"子",
    壬:"申", 癸:"卯",
  };
  if (HAKDANG[dayGan] && allZhis.includes(HAKDANG[dayGan])) push("학당귀인");

  // ── 10. 일주(日柱) 기준 추가 신살 ──

  // 고란살: 특정 일주에 해당하면 성립 (배우자 인연이 늦거나 독립적 기질)
  const GORAN_ILJU = ["甲寅","乙巳","丙午","丁巳","戊午","戊申","辛亥","壬子","壬申","癸亥"];
  if (GORAN_ILJU.includes(pillars[2]?.ganZhi ?? "")) push("고란살");

  // 협록: 일간의 록지(祿地)가 4기둥에서 인접한 두 지지 사이에 끼어있으면 성립
  const ROKJI: Record<string,string> = {
    甲:"寅", 乙:"卯", 丙:"巳", 丁:"午",
    戊:"巳", 己:"午", 庚:"申", 辛:"酉",
    壬:"亥", 癸:"子",
  };
  const rokZhi = ROKJI[dayGan];
  if (rokZhi) {
    const zi = ZHI_LIST.indexOf(rokZhi);
    const prev = ZHI_LIST[(zi - 1 + 12) % 12];
    const next = ZHI_LIST[(zi + 1) % 12];
    if (allZhis.includes(prev) && allZhis.includes(next)) push("협록");
  }

  return result;
}
