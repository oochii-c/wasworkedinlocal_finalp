import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import counselRouter from "./counsel.js";
import { LANG_RULE } from "./prompt-utils.js";

dotenv.config();

const PORT = process.env.PORT || 8000;
const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || "google/gemini-3.5-flash";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PILLARS_LOG = path.join(__dirname, "data", "pillars.jsonl");

// 열람된 사주팔자(천간·지지)를 한 줄씩 누적 저장
function savePillars({ name, gender, chart }) {
  const record = {
    ts: new Date().toISOString(),
    name: name || "",
    gender: gender || "",
    baZi: chart.baZi,
    pillars: chart.pillars.map((p) => ({ key: p.key, gan: p.gan, zhi: p.zhi })),
  };
  fs.mkdirSync(path.dirname(PILLARS_LOG), { recursive: true });
  fs.appendFileSync(PILLARS_LOG, JSON.stringify(record) + "\n", "utf8");
}

const app = express();
app.use(cors());
app.use(express.json());

// AI 용왕 상담 라우터 (server/counsel.js) — POST /api/counsel
app.use(counselRouter);

// 천간 -> 한글명/오행 매핑. 모델이 한자를 오독하지 않도록 명시용.
const GAN_INFO = {
  甲: ["갑", "목"], 乙: ["을", "목"], 丙: ["병", "화"], 丁: ["정", "화"], 戊: ["무", "토"],
  己: ["기", "토"], 庚: ["경", "금"], 辛: ["신", "금"], 壬: ["임", "수"], 癸: ["계", "수"],
};
const GAN_WUXING = Object.fromEntries(Object.entries(GAN_INFO).map(([k, v]) => [k, v[1]]));

// 원국(팔자) 데이터를 프롬프트용 텍스트로 정리
function chartToText(chart) {
  const lines = chart.pillars.map(
    (p) =>
      `${p.key}주: ${p.ganZhi} (천간 ${p.gan}[${GAN_WUXING[p.gan] || "?"}]/${p.shiShenGan}, 지지 ${p.zhi}, 지장간 ${(p.hideGan || []).join(" ")}, 오행 ${p.wuXing}, 십이운성 ${p.diShi}, 납음 ${p.naYin})`
  );
  const dayElem = GAN_WUXING[chart.dayGan] || "?";
  return `일간(나): ${chart.dayGan} (오행: ${dayElem}) · 띠: ${chart.shengXiao}\n팔자: ${chart.baZi.join(" ")}\n${lines.join("\n")}`;
}

const SYSTEM_PROMPT = `너는 '용궁'이라는 사주 서비스의 사주 명리 해설가다.
사용자의 사주 원국(팔자)을 바탕으로 따뜻하고 구체적인 한국어 풀이를 4개의 이야기로 작성한다.
각 이야기는 원국의 실제 간지·십신·오행 근거를 자연스럽게 녹여 서로 다른 주제를 다룬다
(예: 타고난 기질, 관계와 인연, 일과 재물의 흐름, 삶의 방향과 조언).
반드시 주어진 일간(나)의 천간과 그 오행을 기준으로 해석하며, 원국에 없는 간지·오행을 지어내지 않는다.
점술적 단정보다 해석과 격려의 톤을 유지한다.
반드시 아래 JSON 형식만 출력한다(코드블록·설명 없이):
{"stories":[{"title":"...","body":"..."}, ... 4개]}
title은 12자 이내 시적인 제목, body는 3~5문장.

${LANG_RULE}`;

app.post("/api/reading", async (req, res) => {
  if (!API_KEY || API_KEY.includes("여기에_키_입력")) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY가 설정되지 않았습니다. server/.env를 확인하세요." });
  }

  const { name, gender, chart } = req.body || {};
  if (!chart || !chart.pillars) {
    return res.status(400).json({ error: "원국 데이터가 없습니다." });
  }

  try {
    savePillars({ name, gender, chart });
  } catch (e) {
    console.error("팔자 저장 실패:", e);
  }

  try {
    const [dayKor, dayElem] = GAN_INFO[chart.dayGan] || ["?", "?"];
    const anchor = `★ 이 사람의 일간(본인 자신)은 "${chart.dayGan}(${dayKor}${dayElem})", 오행은 "${dayElem}"이다. 모든 풀이는 반드시 이 일간 ${dayKor}${dayElem}을 중심으로 한다. 팔자에 등장하는 다른 천간(예: 辛, 壬 등)을 본인으로 착각하지 마라.`;
    const userMsg = `${anchor}\n\n이름: ${name || "익명"}\n성별: ${gender === "female" ? "여자" : "남자"}\n\n[사주 원국]\n${chartToText(chart)}`;

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
        temperature: 0.9,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: `OpenRouter 오류 (${r.status})`, detail });
    }

    const data = await r.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // 모델이 코드블록 등으로 감싼 경우 대비
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : null;
    }

    if (!parsed || !Array.isArray(parsed.stories)) {
      return res.status(502).json({ error: "풀이 응답 형식 오류", raw: content });
    }

    res.json({ stories: parsed.stories });
  } catch (e) {
    res.status(500).json({ error: "풀이 생성 실패", detail: String(e) });
  }
});

// 주제별 사주 리딩 — 6개 주제 요약(별점 + 한줄) 일괄 생성
const THEME_DEFS = [
  { key: "love", label: "애정" },
  { key: "wealth", label: "재물" },
  { key: "health", label: "건강" },
  { key: "business", label: "사업" },
  { key: "study", label: "학업" },
  { key: "relations", label: "인간관계" },
];

app.post("/api/themes", async (req, res) => {
  if (!API_KEY || API_KEY.includes("여기에_키_입력")) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY가 설정되지 않았습니다. server/.env를 확인하세요." });
  }

  const { name, gender, chart } = req.body || {};
  if (!chart || !chart.pillars) {
    return res.status(400).json({ error: "원국 데이터가 없습니다." });
  }

  try {
    const [dayKor, dayElem] = GAN_INFO[chart.dayGan] || ["?", "?"];
    const anchor = `★ 이 사람의 일간(본인 자신)은 "${chart.dayGan}(${dayKor}${dayElem})", 오행은 "${dayElem}"이다. 모든 풀이는 반드시 이 일간 ${dayKor}${dayElem}을 중심으로 한다.`;
    const themeList = THEME_DEFS.map((t) => `${t.key}(${t.label})`).join(", ");
    const system = `너는 '용궁' 사주 서비스의 명리 해설가다. 사용자의 원국(팔자)을 바탕으로 아래 6개 주제 각각에 대해 별점(1~5 정수)과 요약(공백 포함 60자 이내)을 생성한다.
주제: ${themeList}
원국의 실제 간지·십신·오행 근거로 판단하되, 원국에 없는 간지·오행을 지어내지 않는다. 단정보다 격려의 톤.
반드시 아래 JSON만 출력한다(코드블록·설명 없이):
{"themes":[{"key":"love","stars":4,"summary":"..."}, ... 6개 모두]}
key는 주어진 6개(${THEME_DEFS.map((t) => t.key).join(", ")})를 모두 포함한다.

${LANG_RULE}`;
    const userMsg = `${anchor}\n\n이름: ${name || "익명"}\n성별: ${gender === "female" ? "여자" : "남자"}\n\n[사주 원국]\n${chartToText(chart)}`;

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
        temperature: 0.85,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: `OpenRouter 오류 (${r.status})`, detail });
    }

    const data = await r.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : null;
    }

    if (!parsed || !Array.isArray(parsed.themes)) {
      return res.status(502).json({ error: "주제 응답 형식 오류", raw: content });
    }

    // 주제 정의 순서대로 정렬 + label 병합, 누락/이상치 방어
    const byKey = Object.fromEntries(parsed.themes.map((t) => [t.key, t]));
    const themes = THEME_DEFS.map((def) => {
      const g = byKey[def.key] || {};
      const stars = Math.min(5, Math.max(1, Math.round(Number(g.stars) || 3)));
      return { key: def.key, label: def.label, stars, summary: String(g.summary || "").trim() };
    });

    res.json({ themes });
  } catch (e) {
    res.status(500).json({ error: "주제 풀이 생성 실패", detail: String(e) });
  }
});

// 주제별 상세 풀이 — 한 주제에 대해 원국 근거로 깊이 있는 풀이 1편 생성
app.post("/api/theme-detail", async (req, res) => {
  if (!API_KEY || API_KEY.includes("여기에_키_입력")) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY가 설정되지 않았습니다. server/.env를 확인하세요." });
  }

  const { key, label, name, gender, chart } = req.body || {};
  if (!chart || !chart.pillars || !key) {
    return res.status(400).json({ error: "원국 데이터 또는 주제가 없습니다." });
  }

  try {
    const [dayKor, dayElem] = GAN_INFO[chart.dayGan] || ["?", "?"];
    const anchor = `★ 이 사람의 일간(본인 자신)은 "${chart.dayGan}(${dayKor}${dayElem})", 오행은 "${dayElem}"이다. 모든 풀이는 반드시 이 일간 ${dayKor}${dayElem}을 중심으로 한다.`;
    const system = `너는 '용궁' 사주 서비스의 명리 해설가다. 사용자의 원국(팔자)을 바탕으로 '${label}' 주제 하나에 대해 깊이 있는 풀이를 작성한다.
원국의 실제 간지·십신·오행 근거를 자연스럽게 녹여 4~6문장으로 구체적으로 서술한다. 원국에 없는 간지·오행을 지어내지 않으며, 단정보다 해석과 격려의 톤을 유지한다.
반드시 아래 JSON만 출력한다(코드블록·설명 없이): {"text":"..."}

${LANG_RULE}`;
    const userMsg = `${anchor}\n\n주제: ${label}\n이름: ${name || "익명"}\n성별: ${gender === "female" ? "여자" : "남자"}\n\n[사주 원국]\n${chartToText(chart)}`;

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
        temperature: 0.9,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: `OpenRouter 오류 (${r.status})`, detail });
    }

    const data = await r.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : null;
    }

    if (!parsed?.text) {
      return res.status(502).json({ error: "주제 상세 응답 형식 오류", raw: content });
    }

    res.json({ text: parsed.text });
  } catch (e) {
    res.status(500).json({ error: "주제 상세 생성 실패", detail: String(e) });
  }
});

// 지지 → 띠 매핑
const ZHI_ZODIAC = {
  子: "쥐", 丑: "소", 寅: "호랑이", 卯: "토끼",
  辰: "용", 巳: "뱀", 午: "말", 未: "양",
  申: "원숭이", 酉: "닭", 戌: "개", 亥: "돼지",
};

app.post("/api/year-fortune", async (req, res) => {
  if (!API_KEY || API_KEY.includes("여기에_키_입력")) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY 미설정" });
  }

  const { year, ganZhi, rel, dayGan, stars } = req.body || {};
  if (!year || !ganZhi || !dayGan) {
    return res.status(400).json({ error: "필수 파라미터 누락" });
  }

  const gan = ganZhi[0];
  const zhi = ganZhi[1];
  const [dayKor, dayElem] = GAN_INFO[dayGan] || ["?", "?"];
  const [yearKor, yearElem] = GAN_INFO[gan] || ["?", "?"];
  const zodiac = ZHI_ZODIAC[zhi] || zhi;
  const starsLabel = ["", "★☆☆☆☆", "★★☆☆☆", "★★★☆☆", "★★★★☆", "★★★★★"][stars] || "";

  const prompt = `너는 사주 명리 해설가다. 아래 정보를 바탕으로 해당 연도의 세운(歲運) 풀이를 작성해.

- 일간(나): ${dayGan}(${dayKor}${dayElem}) · 오행 ${dayElem}
- ${year}년 세운 간지: ${ganZhi} — 천간 ${gan}(${yearKor}${yearElem}), 지지 ${zhi}(${zodiac}의 해)
- 천간 관계: ${rel} (${starsLabel}) — 세운 천간 ${yearElem}이 일간 ${dayElem}에 미치는 영향
- 총평: ${stars}점짜리 해

규칙:
1. 반드시 3문장으로 작성. 각 문장은 서로 다른 측면(이 해의 기운/실천 방향/구체적 조언)을 담아.
2. ${zodiac}의 해 특성을 자연스럽게 한 문장에 녹여.
3. 일간 ${dayGan}(${dayElem}) 기준으로 구체적으로, 따뜻하게.
4. 반드시 아래 JSON만 출력(코드블록·설명 없이): {"text":"..."}

${LANG_RULE}`;

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.95,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: `OpenRouter 오류 (${r.status})`, detail });
    }

    const data = await r.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : null;
    }

    if (!parsed?.text) {
      return res.status(502).json({ error: "응답 형식 오류", raw: content });
    }

    res.json({ text: parsed.text });
  } catch (e) {
    res.status(500).json({ error: "연도 운세 생성 실패", detail: String(e) });
  }
});

app.post("/api/dayun-fortune", async (req, res) => {
  if (!API_KEY || API_KEY.includes("여기에_키_입력")) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY 미설정" });
  }

  const { dayGan, ganZhi, startYear, endYear, rel, stars } = req.body || {};
  if (!dayGan || !ganZhi || !startYear) {
    return res.status(400).json({ error: "필수 파라미터 누락" });
  }

  const gan = ganZhi[0];
  const zhi = ganZhi[1];
  const [dayKor, dayElem] = GAN_INFO[dayGan] || ["?", "?"];
  const [ganKor, ganElem] = GAN_INFO[gan] || ["?", "?"];
  const zodiac = ZHI_ZODIAC[zhi] || zhi;
  const starsLabel = ["", "★☆☆☆☆", "★★☆☆☆", "★★★☆☆", "★★★★☆", "★★★★★"][stars] || "";

  const prompt = `너는 사주 명리 해설가다. 아래 정보를 바탕으로 해당 대운(大運) 10년간의 풀이를 작성해.

- 일간(나): ${dayGan}(${dayKor}${dayElem}) · 오행 ${dayElem}
- 대운 간지: ${ganZhi} — 천간 ${gan}(${ganKor}${ganElem}), 지지 ${zhi}(${zodiac})
- 대운 기간: ${startYear}년 ~ ${endYear ?? startYear + 9}년
- 천간 관계: ${rel} (${starsLabel})

규칙:
1. 반드시 4~5문장으로 작성. 각 문장은 서로 다른 측면을 담아: 이 대운의 전체 기운 → 강점/기회 → 주의할 점 → 삶의 방향 조언.
2. ${zodiac} 기운을 자연스럽게 한 문장에 녹여.
3. 일간 ${dayKor}${dayElem}(${dayGan}) 기준으로 구체적으로, 따뜻하고 힘있게.
4. 출력 텍스트에 한자(漢字)를 절대 사용하지 않는다. 간지·천간·지지는 반드시 한글로만 표기한다 (예: 壬申 → 임신, 戊戌 → 무술).
5. 반드시 아래 JSON만 출력(코드블록·설명 없이): {"text":"..."}

${LANG_RULE}`;

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.9,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: `OpenRouter 오류 (${r.status})`, detail });
    }

    const data = await r.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }

    if (!parsed?.text) {
      return res.status(502).json({ error: "응답 형식 오류", raw: content });
    }

    res.json({ text: parsed.text });
  } catch (e) {
    res.status(500).json({ error: "대운 풀이 생성 실패", detail: String(e) });
  }
});

// 오늘 하루 운세 — 일진(日辰) + 택일·신살 정보로 3문장 풀이 생성
app.post("/api/daily-fortune", async (req, res) => {
  if (!API_KEY || API_KEY.includes("여기에_키_입력")) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY 미설정" });
  }

  const {
    dayGan, dayGanZhi, monthGanZhi, yearGanZhi,
    rel, stars, jiShen, xiongSha, yi, ji, chong, shenSha,
    jianChu, tianShen, tianShenLuck, positionCai, positionXi,
  } = req.body || {};
  if (!dayGan || !dayGanZhi) {
    return res.status(400).json({ error: "필수 파라미터 누락" });
  }

  const [dayKor, dayElem] = GAN_INFO[dayGan] || ["?", "?"];
  const tGan = dayGanZhi[0];
  const tZhi = dayGanZhi[1];
  const [tKor, tElem] = GAN_INFO[tGan] || ["?", "?"];
  const zodiac = ZHI_ZODIAC[tZhi] || tZhi;
  const starsLabel = ["", "★☆☆☆☆", "★★☆☆☆", "★★★☆☆", "★★★★☆", "★★★★★"][stars] || "";
  const list = (a) => (Array.isArray(a) && a.length ? a.join(", ") : "없음");
  const pos = [positionCai && `재물 ${positionCai}쪽`, positionXi && `희신 ${positionXi}쪽`]
    .filter(Boolean).join(" · ") || "특별한 길방 없음";

  const prompt = `너는 '용궁' 사주 서비스의 명리 해설가다. 아래 정보를 바탕으로 "오늘 하루"를 두 부분으로 풀이해.

- 일간(나): ${dayGan}(${dayKor}${dayElem}) · 오행 ${dayElem}
- 오늘 일진: ${dayGanZhi} — 천간 ${tGan}(${tKor}${tElem}), 지지 ${tZhi}(${zodiac})
- 이번달 월운: ${monthGanZhi || "?"} · 올해 세운: ${yearGanZhi || "?"}
- 일진 천간과 일간의 관계: ${rel || "?"} (${starsLabel})
- 건제12신: ${jianChu || "?"}
- 십이신(황흑도): ${tianShen || "?"}${tianShenLuck ? ` (${tianShenLuck})` : ""}
- 오늘의 충: ${chong || "없음"}
- 길신: ${list(jiShen)}
- 흉살: ${list(xiongSha)}
- 길방: ${pos}
- 택일상 좋은 일: ${list(yi)}
- 택일상 꺼릴 일: ${list(ji)}
- 사주 원국 신살: ${list(shenSha)}

규칙:
[energy — "오늘의 기운"]
- 2~3문장. 건제12신·십이신(황흑도)·충·길신/흉살·길방을 엮어 "오늘이 어떤 성격의 날인지" 객관적으로 서술한다.
- 일간(나)·개인 조언은 넣지 않는다. 날 자체의 기운 묘사에 집중.
- 길신/흉살은 의미 있는 것 한둘만, 쉬운 우리말로 풀어 쓴다.

[text — "오늘의 총평"]
- 3문장. ①오늘의 전체 흐름 ②하면 좋은 실천·태도 ③조심할 것.
- 일간 ${dayKor}${dayElem}(${dayGan}) 기준으로 구체적이고 따뜻하게. 단정보다 격려의 톤.

공통:
- 출력 텍스트에 한자(漢字)를 쓰지 않는다. 간지·용어는 한글로 (예: 甲子 → 갑자, 定 → 정일, 靑龍 → 청룡).
- 원국에 없는 간지·오행은 지어내지 않는다.
- 반드시 아래 JSON만 출력(코드블록·설명 없이): {"energy":"...","text":"...","src":"..."}
  - src 는 풀이의 핵심 근거(건제·십이신·신살 등)를 한 줄로 요약. 마땅치 않으면 빈 문자열.

${LANG_RULE}`;

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.95,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: `OpenRouter 오류 (${r.status})`, detail });
    }

    const data = await r.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : null;
    }

    if (!parsed?.text) {
      return res.status(502).json({ error: "응답 형식 오류", raw: content });
    }

    res.json({ energy: parsed.energy || "", text: parsed.text, src: parsed.src || "" });
  } catch (e) {
    res.status(500).json({ error: "오늘의 운세 생성 실패", detail: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`saju server on http://localhost:${PORT} (model: ${MODEL})`);
});
