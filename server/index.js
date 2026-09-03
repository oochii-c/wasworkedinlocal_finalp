import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import counselRouter from "./counsel.js";
import { GAN_INFO, ZHI_INFO, wuXingLine, chartToText } from "./prompt-utils.js";
import {
  anchorLine,
  READING_SYSTEM,
  buildThemesSystem,
  buildThemeDetailSystem,
  buildThemeComboSystem,
  YEAR_FORTUNE_SYSTEM,
  buildYearFortuneUser,
  DAYUN_FORTUNE_SYSTEM,
  buildDaYunFortuneUser,
  buildDailyFortunePrompt,
  buildDailyTalismanPrompt,
} from "./prompts/index.js";

dotenv.config();

const PORT = process.env.PORT || 8000;
const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PILLARS_LOG = path.join(__dirname, "data", "pillars.jsonl");

// 부적 이미지 생성용 스타일 참고 이미지 (data URL, 1회만 인코딩해 재사용)
const TALISMAN_STYLE_REF = `data:image/png;base64,${fs
  .readFileSync(path.join(__dirname, "assets", "talisman-style-ref.png"))
  .toString("base64")}`;

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

// 원국 -> 프롬프트용 텍스트 변환(chartToText)과 천간·지지 라벨 헬퍼는
// prompt-utils.js 를 단일 출처로 공유한다(위 import).

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
    const userMsg = `${anchorLine(chart.dayGan)}\n\n이름: ${name || "익명"}\n성별: ${gender === "female" ? "여자" : "남자"}\n\n[사주 원국]\n${chartToText(chart)}`;

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: READING_SYSTEM },
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
  { key: "health", label: "건강" },
  { key: "love", label: "애정" },
  { key: "relations", label: "인간관계" },
  { key: "wealth", label: "재물" },
  { key: "business", label: "사업" },
  { key: "study", label: "학업" },
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
    const system = buildThemesSystem(THEME_DEFS);
    const userMsg = `${anchorLine(chart.dayGan)}\n\n이름: ${name || "익명"}\n성별: ${gender === "female" ? "여자" : "남자"}\n\n[사주 원국]\n${chartToText(chart)}`;

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
    // 별점은 클라이언트가 원국 십성으로 결정론 산출 — 여기선 요약만 병합한다.
    const themes = THEME_DEFS.map((def) => {
      const g = byKey[def.key] || {};
      return { key: def.key, label: def.label, summary: String(g.summary || "").trim() };
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
    const system = buildThemeDetailSystem(label);
    const userMsg = `${anchorLine(chart.dayGan)}\n\n주제: ${label}\n이름: ${name || "익명"}\n성별: ${gender === "female" ? "여자" : "남자"}\n\n[사주 원국]\n${chartToText(chart)}`;

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

// 두 주제가 맞물리는 복합 풀이 — 십성 상생상극 관계를 근거로 1편 생성
app.post("/api/theme-combo", async (req, res) => {
  if (!API_KEY || API_KEY.includes("여기에_키_입력")) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY가 설정되지 않았습니다. server/.env를 확인하세요." });
  }

  const { labels, name, gender, chart } = req.body || {};
  if (!chart || !chart.pillars || !Array.isArray(labels) || labels.length !== 2) {
    return res.status(400).json({ error: "원국 데이터 또는 주제 2개가 필요합니다." });
  }

  try {
    const system = buildThemeComboSystem(labels[0], labels[1]);
    const userMsg = `${anchorLine(chart.dayGan)}\n\n주제: ${labels[0]} × ${labels[1]}\n이름: ${name || "익명"}\n성별: ${gender === "female" ? "여자" : "남자"}\n\n[사주 원국]\n${chartToText(chart)}`;

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
      return res.status(502).json({ error: "복합 풀이 응답 형식 오류", raw: content });
    }

    res.json({ text: parsed.text });
  } catch (e) {
    res.status(500).json({ error: "복합 풀이 생성 실패", detail: String(e) });
  }
});

app.post("/api/year-fortune", async (req, res) => {
  if (!API_KEY || API_KEY.includes("여기에_키_입력")) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY 미설정" });
  }

  const { year, ganZhi, rel, dayGan, stars, wuXingCount, domainScores, monthly } = req.body || {};
  if (!year || !ganZhi || !dayGan) {
    return res.status(400).json({ error: "필수 파라미터 누락" });
  }

  const gan = ganZhi[0];
  const zhi = ganZhi[1];
  const [dayKor, dayElem] = GAN_INFO[dayGan] || ["?", "?"];
  const [yearKor, yearElem] = GAN_INFO[gan] || ["?", "?"];
  const zodiac = (ZHI_INFO[zhi] || [null, zhi])[1];
  const starsLabel = ["", "★☆☆☆☆", "★★☆☆☆", "★★★☆☆", "★★★★☆", "★★★★★"][stars] || "";

  const DOMAIN_ORDER = ["건강", "애정", "인간관계", "재물", "직업", "학업"];
  const domainScoreLine = domainScores && typeof domainScores === "object"
    ? DOMAIN_ORDER.filter((d) => d in domainScores).map((d) => `${d} ${domainScores[d]}`).join(" · ")
    : "정보 없음";
  const monthlyLine = Array.isArray(monthly) && monthly.length
    ? monthly.map((m) => `${m.month}월 ${m.ganZhi} ${m.score}점`).join(" · ")
    : "정보 없음";

  const userMsg = `${anchorLine(dayGan)}

${buildYearFortuneUser({
    year, ganZhi, gan, zhi, dayGan, dayKor, dayElem, yearKor, yearElem, zodiac, rel, stars, starsLabel,
    wuXing: wuXingLine({ wuXingCount }),
    domainScoreLine, monthlyLine,
  })}`;

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: YEAR_FORTUNE_SYSTEM },
          { role: "user", content: userMsg },
        ],
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

    res.json({
      text: parsed.text,
      summary: parsed.summary || "",
      domains: parsed.domains && typeof parsed.domains === "object" ? parsed.domains : {},
      months: Array.isArray(parsed.months) ? parsed.months : [],
    });
  } catch (e) {
    res.status(500).json({ error: "연도 운세 생성 실패", detail: String(e) });
  }
});

app.post("/api/dayun-fortune", async (req, res) => {
  if (!API_KEY || API_KEY.includes("여기에_키_입력")) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY 미설정" });
  }

  const { dayGan, ganZhi, startYear, endYear, rel, stars, wuXingCount } = req.body || {};
  if (!dayGan || !ganZhi || !startYear) {
    return res.status(400).json({ error: "필수 파라미터 누락" });
  }

  const gan = ganZhi[0];
  const zhi = ganZhi[1];
  const [dayKor, dayElem] = GAN_INFO[dayGan] || ["?", "?"];
  const [ganKor, ganElem] = GAN_INFO[gan] || ["?", "?"];
  const zodiac = (ZHI_INFO[zhi] || [null, zhi])[1];
  const starsLabel = ["", "★☆☆☆☆", "★★☆☆☆", "★★★☆☆", "★★★★☆", "★★★★★"][stars] || "";

  const userMsg = `${anchorLine(dayGan)}

${buildDaYunFortuneUser({
    dayGan, dayKor, dayElem, ganZhi, gan, ganKor, ganElem, zhi, zodiac, rel, starsLabel,
    startYear, endYear: endYear ?? startYear + 9,
    wuXing: wuXingLine({ wuXingCount }),
  })}`;

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: DAYUN_FORTUNE_SYSTEM },
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
  const zodiac = (ZHI_INFO[tZhi] || [null, tZhi])[1];
  const starsLabel = ["", "★☆☆☆☆", "★★☆☆☆", "★★★☆☆", "★★★★☆", "★★★★★"][stars] || "";
  const list = (a) => (Array.isArray(a) && a.length ? a.join(", ") : "없음");
  const pos = [positionCai && `재물 ${positionCai}쪽`, positionXi && `희신 ${positionXi}쪽`]
    .filter(Boolean).join(" · ") || "특별한 길방 없음";

  const prompt = buildDailyFortunePrompt({
    dayGan, dayKor, dayElem, dayGanZhi, tGan, tKor, tElem, tZhi, zodiac,
    monthGanZhi, yearGanZhi, rel, starsLabel, jianChu, tianShen, tianShenLuck, chong,
    jiShen: list(jiShen), xiongSha: list(xiongSha), yi: list(yi), ji: list(ji),
    shenSha: list(shenSha), pos,
  });

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
        // 주어진 일진 값을 그대로 인용해야 하는 풀이라 낮게 잡는다.
        // 0.95 에서는 "한자를 쓰지 않는다" 규칙을 5회 중 2회 어겼다.
        temperature: 0.4,
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

const IMAGE_MODEL = process.env.OPENROUTER_IMAGE_MODEL || "google/gemini-3-pro-image";

// 오늘의 부적 — 오늘 일진 신호(길신·흉살·방위·밴드)로 개인화된 부적 "이미지" 자체를 생성 (GPT-5 Image)
app.post("/api/daily-talisman", async (req, res) => {
  if (!API_KEY || API_KEY.includes("여기에_키_입력")) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY 미설정" });
  }

  const { dayGan, dayGanZhi, band, jiShen, xiongSha, yi, ji, positionCai } = req.body || {};
  if (!dayGan || !dayGanZhi) {
    return res.status(400).json({ error: "필수 파라미터 누락" });
  }

  const [dayKor, dayElem] = GAN_INFO[dayGan] || ["?", "?"];
  const list = (a) => (Array.isArray(a) && a.length ? a.join(", ") : "없음");

  const prompt = buildDailyTalismanPrompt({
    dayGan, dayKor, dayElem, dayGanZhi, band, positionCai,
    jiShen: list(jiShen), xiongSha: list(xiongSha), yi: list(yi), ji: list(ji),
  });

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: TALISMAN_STYLE_REF } },
            ],
          },
        ],
        modalities: ["image", "text"],
        image_config: { aspect_ratio: "2:3" },
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: `OpenRouter 오류 (${r.status})`, detail });
    }

    const data = await r.json();
    const message = data.choices?.[0]?.message;
    const imageUrl = message?.images?.[0]?.image_url?.url;
    if (!imageUrl) {
      return res.status(502).json({ error: "이미지 생성 실패", raw: message?.content || "" });
    }

    const [title, caption, blessing] = String(message.content || "").trim().split("|");

    res.json({
      image: imageUrl,
      title: title || "오늘의 부적",
      caption: caption || "",
      blessing: blessing || "오늘 하루도 좋은 기운이 함께하길 바랍니다.",
    });
  } catch (e) {
    res.status(500).json({ error: "오늘의 부적 생성 실패", detail: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`saju server on http://localhost:${PORT} (model: ${MODEL})`);
});
