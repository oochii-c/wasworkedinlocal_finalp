import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 8000;
const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || "google/gemini-3.5-flash";

const app = express();
app.use(cors());
app.use(express.json());

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
      `${p.key}주: ${p.ganZhi} (천간 ${p.gan}[${GAN_WUXING[p.gan] || "?"}]/${p.shiShenGan}, 지지 ${p.zhi}, 지장간 ${p.hideGan.join(" ")}, 오행 ${p.wuXing}, 십이운성 ${p.diShi}, 납음 ${p.naYin})`
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
title은 12자 이내 시적인 제목, body는 3~5문장.`;

app.post("/api/reading", async (req, res) => {
  if (!API_KEY || API_KEY.includes("여기에_키_입력")) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY가 설정되지 않았습니다. server/.env를 확인하세요." });
  }

  const { name, gender, chart } = req.body || {};
  if (!chart || !chart.pillars) {
    return res.status(400).json({ error: "원국 데이터가 없습니다." });
  }

  const [dayKor, dayElem] = GAN_INFO[chart.dayGan] || ["?", "?"];
  const anchor = `★ 이 사람의 일간(본인 자신)은 "${chart.dayGan}(${dayKor}${dayElem})", 오행은 "${dayElem}"이다. 모든 풀이는 반드시 이 일간 ${dayKor}${dayElem}을 중심으로 한다. 팔자에 등장하는 다른 천간(예: 辛, 壬 등)을 본인으로 착각하지 마라.`;
  const userMsg = `${anchor}\n\n이름: ${name || "익명"}\n성별: ${gender === "female" ? "여자" : "남자"}\n\n[사주 원국]\n${chartToText(chart)}`;

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

app.listen(PORT, () => {
  console.log(`saju server on http://localhost:${PORT} (model: ${MODEL})`);
});
